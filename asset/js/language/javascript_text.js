/**
 * Visual Blocks Language
 *
 * Copyright 2012 Google Inc.
 * http://code.google.com/p/google-blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Generating JavaScript for text blocks.
 * @author fraser@google.com (Neil Fraser)
 * Due to the frequency of long strings, the 80-column wrap rule need not apply
 * to language files.
 */

Blockly.JavaScript = Blockly.Generator.get('JavaScript');

Blockly.JavaScript.text = function() {
  // Text value.
  return Blockly.JavaScript.quote_(this.getTitleText(1));
};

Blockly.JavaScript.text_join = function(opt_dropParens) {
  // Create a string made up of any number of elements of any type.
  if (this.itemCount_ == 0) {
    return '\'\'';
  } else if (this.itemCount_ == 1) {
    var argument0 = Blockly.JavaScript.valueToCode_(this, 0, true) || '\'\'';
    return 'String(' + argument0 + ')';
  } else if (this.itemCount_ == 2) {
    var argument0 = Blockly.JavaScript.valueToCode_(this, 0, true) || '\'\'';
    var argument1 = Blockly.JavaScript.valueToCode_(this, 1, true) || '\'\'';
    var code = 'String(' + argument0 + ') + String(' + argument1 + ')';
    if (!opt_dropParens) {
      code = '(' + code + ')';
    }
    return code;
  } else {
    var code = new Array(this.itemCount_);
    for (n = 0; n < this.itemCount_; n++) {
      code[n] = Blockly.JavaScript.valueToCode_(this, n, true) || '\'\'';
    }
    return '[' + code.join(',') + '].join(\'\')';
  }
};

Blockly.JavaScript.text_length = function() {
  // String length.
  var argument0 = Blockly.JavaScript.valueToCode_(this, 0) || '\'\'';
  return argument0 + '.length';
};

Blockly.JavaScript.text_isEmpty = function() {
  // Is the string null?
  var argument0 = Blockly.JavaScript.valueToCode_(this, 0) || '\'\'';
  return '!' + argument0 + '.length';
};

Blockly.JavaScript.text_endString = function() {
  // Return a leading or trailing substring.
  var first = this.getValueLabel(0) == this.MSG_FIRST;
  var code;
  if (first) {
    var argument0 = Blockly.JavaScript.valueToCode_(this, 0, true) || '0';
    var argument1 = Blockly.JavaScript.valueToCode_(this, 1) || '\'\'';
    code = argument1 + '.substring(0, ' + argument0 + ')';
  } else {
    var argument0 = Blockly.JavaScript.valueToCode_(this, 0) || '0';
    var argument1 = Blockly.JavaScript.valueToCode_(this, 1, true) || '\'\'';
    var tempVar = Blockly.JavaScript.variableDB_.getDistinctName('temp_text',
        Blockly.Variables.NAME_TYPE);
    Blockly.JavaScript.definitions_['variables'] += '\nvar ' + tempVar + ';';
    code = '[' + tempVar + ' = ' + argument1 + ', ' +
        tempVar + '.substring(' + tempVar + '.length - ' + argument0 + ')][1]';
  }
  return code;
};

Blockly.JavaScript.text_indexOf = function(opt_dropParens) {
  // Search the text for a substring.
  var operator = this.getTitleText(1) == this.MSG_FIRST ? 'indexOf' : 'lastIndexOf';
  var argument0 = Blockly.JavaScript.valueToCode_(this, 0) || '\'\'';
  var argument1 = Blockly.JavaScript.valueToCode_(this, 1) || '\'\'';
  var code = argument1 + '.' + operator + '(' + argument0 + ') + 1';
  if (!opt_dropParens) {
    code = '(' + code + ')';
  }
  return code;
};

Blockly.JavaScript.text_charAt = function() {
  // Get letter at index.
  var argument0 = Blockly.JavaScript.valueToCode_(this, 0, true) || '1';
  var argument1 = Blockly.JavaScript.valueToCode_(this, 1) || '[]';
  // Blockly uses one-based indicies.
  if (argument0.match(/^\d+$/)) {
    // If the index is a naked number, decrement it right now.
    argument0 = parseInt(argument0, 10) - 1;
  } else {
    // If the index is dynamic, decrement it in code.
    argument0 += ' - 1';
  }
  return argument1 + '[' + argument0 + ']';
};

Blockly.JavaScript.text_changeCase = function() {
  // Change capitalization.
  var operator;
  switch (this.getValueLabel(0)) {
    case this.MSG_UPPERCASE:
      operator = 'toUpperCase';
      break;
    case this.MSG_LOWERCASE:
      operator = 'toLowerCase';
      break;
    case this.MSG_TITLECASE:
      operator = null;
      break;
    default:
      throw 'Unknown operator.';
  }

  var code;
  if (operator) {
    // Upper and lower case are functions built into JavaScript.
    var argument0 = Blockly.JavaScript.valueToCode_(this, 0) || '\'\'';
    code = argument0 + '.' + operator + '()';
  } else {
    if (!Blockly.JavaScript.definitions_['text_toTitleCase']) {
      // Title case is not a native JavaScript function.  Define one.
      var functionName = Blockly.JavaScript.variableDB_.getDistinctName('text_toTitleCase',
          Blockly.Generator.NAME_TYPE);
      Blockly.JavaScript.text_changeCase.toTitleCase = functionName;
      var func = [];
      func.push('function ' + functionName + '(str) {');
      func.push('  return str.replace(/\\w\\S*/g,');
      func.push('      function(txt) {return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});');
      func.push('}');
      Blockly.JavaScript.definitions_['text_toTitleCase'] = func.join('\n');
    }
    var argument0 = Blockly.JavaScript.valueToCode_(this, 0, true) || '\'\'';
    code = Blockly.JavaScript.text_changeCase.toTitleCase + '(' + argument0 + ')';
  }
  return code;
};

Blockly.JavaScript.text_trim = function() {
  // Trim spaces.
  var operator;
  switch (this.getTitleText(1)) {
    case this.MSG_LEFT:
      operator = '/^\\s+/';
      break;
    case this.MSG_RIGHT:
      operator = '/\\s+$/';
      break;
    case this.MSG_BOTH:
      operator = '/^\\s+|\\s+$/g';
      break;
    default:
      throw 'Unknown operator.';
  }

  var argument0 = Blockly.JavaScript.valueToCode_(this, 0) || '\'\'';
  return argument0 + '.replace(' + operator + ', \'\')';
};

Blockly.JavaScript.text_print = function() {
  // Print statement.
  var argument0 = Blockly.JavaScript.valueToCode_(this, 0, true) || '\'\'';
  return 'window.alert(' + argument0 + ');\n';
};
