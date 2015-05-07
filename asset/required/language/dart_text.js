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
 * @fileoverview Generating Dart for text blocks.
 * @author fraser@google.com (Neil Fraser)
 * Due to the frequency of long strings, the 80-column wrap rule need not apply
 * to language files.
 */

Blockly.Dart = Blockly.Generator.get('Dart');

Blockly.Dart.text = function() {
  // Text value.
  return Blockly.Dart.quote_(this.getTitleText(1));
};

Blockly.Dart.text_join = function(opt_dropParens) {
  // Create a string made up of any number of elements of any type.
  if (this.itemCount_ == 0) {
    return '\'\'';
  } else if (this.itemCount_ == 1) {
    var argument0 = Blockly.Dart.valueToCode_(this, 0, true) || '\'\'';
    return argument0 + '.toString()';
  } else if (this.itemCount_ == 2) {
    var argument0 = Blockly.Dart.valueToCode_(this, 0) || '\'\'';
    var argument1 = Blockly.Dart.valueToCode_(this, 1) || '\'\'';
    var code = argument0 + '.toString() + ' + argument1 + '.toString()';
    if (!opt_dropParens) {
      code = '(' + code + ')';
    }
    return code;
  } else {
    var code = [];
    code[0] = 'new StringBuffer(' + (Blockly.Dart.valueToCode_(this, 0, true) || '\'\'') + ')';
    for (n = 1; n < this.itemCount_; n++) {
      code[n] = '.add(' + (Blockly.Dart.valueToCode_(this, n, true) || '\'\'') + ')';
    }
    code = code.join('') + '.toString()';
    if (!opt_dropParens) {
      code = '(' + code + ')';
    }
    return code;
  }
};

Blockly.Dart.text_length = function() {
  // String length.
  var argument0 = Blockly.Dart.valueToCode_(this, 0) || '\'\'';
  return argument0 + '.length';
};

Blockly.Dart.text_isEmpty = function() {
  // Is the string null?
  var argument0 = Blockly.Dart.valueToCode_(this, 0) || '\'\'';
  return argument0 + '.isEmpty()';
};

Blockly.Dart.text_endString = function() {
  // Return a leading or trailing substring.
  var first = this.getValueLabel(0) == this.MSG_FIRST;
  var code;
  if (first) {
    var argument0 = Blockly.Dart.valueToCode_(this, 0, true) || '0';
    var argument1 = Blockly.Dart.valueToCode_(this, 1) || '\'\'';
    code = argument1 + '.substring(0, ' + argument0 + ')';
  } else {
    var argument0 = Blockly.Dart.valueToCode_(this, 0) || '0';
    var argument1 = Blockly.Dart.valueToCode_(this, 1, true) || '\'\'';
    var tempVar = Blockly.Dart.variableDB_.getDistinctName('temp_text',
        Blockly.Variables.NAME_TYPE);
    Blockly.Dart.definitions_['variables'] += '\nString ' + tempVar + ';';
    code = '[' + tempVar + ' = ' + argument1 + ', ' +
        tempVar + '.substring(' + tempVar + '.length - ' + argument0 + ')][1]';
  }
  return code;
};

Blockly.Dart.text_indexOf = function(opt_dropParens) {
  // Search the text for a substring.
  var operator = this.getTitleText(1) == this.MSG_FIRST ? 'indexOf' : 'lastIndexOf';
  var argument0 = Blockly.Dart.valueToCode_(this, 0) || '\'\'';
  var argument1 = Blockly.Dart.valueToCode_(this, 1) || '\'\'';
  var code = argument1 + '.' + operator + '(' + argument0 + ') + 1';
  if (!opt_dropParens) {
    code = '(' + code + ')';
  }
  return code;
};

Blockly.Dart.text_charAt = function() {
  // Get letter at index.
  var argument0 = Blockly.Dart.valueToCode_(this, 0, true) || '1';
  var argument1 = Blockly.Dart.valueToCode_(this, 1) || '[]';
  // Blockly uses one-based arrays.
  if (argument0.match(/^\d+$/)) {
    // If the index is a naked number, decrement it right now.
    argument0 = parseInt(argument0, 10) - 1;
  } else {
    // If the index is dynamic, decrement it in code.
    argument0 += ' - 1';
  }
  return argument1 + '[' + argument0 + ']';
};

Blockly.Dart.text_changeCase = function() {
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
    // Upper and lower case are functions built into Dart.
    var argument0 = Blockly.Dart.valueToCode_(this, 0) || '\'\'';
    code = argument0 + '.' + operator + '()';
  } else {
    if (!Blockly.Dart.definitions_['toTitleCase']) {
      // Title case is not a native Dart function.  Define one.
      var functionName = Blockly.Dart.variableDB_.getDistinctName('text_toTitleCase',
          Blockly.Generator.NAME_TYPE);
      Blockly.Dart.text_changeCase.toTitleCase = functionName;
      var func = [];
      func.push('String ' + functionName + '(str) {');
      func.push('  RegExp exp = const RegExp(@"(\\w\\S*)");');
      func.push('  List<String> list = str.split(exp);');
      func.push('  String title = \'\';');
      func.push('  for (String part in list) {');
      func.push('    if (part.length > 0) {');
      func.push('      title += part[0].toUpperCase();');
      func.push('      if (part.length > 0) {');
      func.push('        title += part.substring(1).toLowerCase();');
      func.push('      }');
      func.push('    }');
      func.push('  }');
      func.push('  return title;');
      func.push('}');
      Blockly.Dart.definitions_['toTitleCase'] = func.join('\n');
    }
    var argument0 = Blockly.Dart.valueToCode_(this, 0, true) || '\'\'';
    code = Blockly.Dart.text_changeCase.toTitleCase + '(' + argument0 + ')';
  }
  return code;
};

Blockly.Dart.text_trim = function() {
  // Trim spaces.
  var argument0 = Blockly.Dart.valueToCode_(this, 0) || '\'\'';
  var operator = this.getTitleText(1);
  if (operator == this.MSG_BOTH) {
    return argument0 + '.trim()';
  }
  var regex = operator == this.MSG_LEFT ? '^\\s+' : '\\s+$';
  return argument0 + '.replaceFirst(new RegExp(@"' + regex + '"), \'\')';
};

Blockly.Dart.text_print = function() {
  // Print statement.
  var argument0 = Blockly.Dart.valueToCode_(this, 0, true) || '\'\'';
  return 'print(' + argument0 + ');\n';
};
