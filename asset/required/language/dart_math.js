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
 * @fileoverview Generating Dart for math blocks.
 * @author fraser@google.com (Neil Fraser)
 * Due to the frequency of long strings, the 80-column wrap rule need not apply
 * to language files.
 */

Blockly.Dart = Blockly.Generator.get('Dart');

Blockly.Dart.math_number = function() {
  // Numeric value.
  return window.parseFloat(this.getTitleText(0));
};

Blockly.Dart.math_arithmetic = function(opt_dropParens) {
  // Basic arithmetic operators, and power.
  var argument0 = Blockly.Dart.valueToCode_(this, 0) || '0';
  var argument1 = Blockly.Dart.valueToCode_(this, 1) || '0';
  var code;
  
  if (this.getValueLabel(1) == this.MSG_POW) {
    code = 'Math.pow(' + argument0 + ', ' + argument1 + ')';
  } else {
    var map = {};
    map[this.MSG_ADD] = '+';
    map[this.MSG_MINUS] = '-';
    map[this.MSG_MULTIPLY] = '*';
    map[this.MSG_DIVIDE] = '/';
    var operator = map[this.getValueLabel(1)];
    code = argument0 + ' ' + operator + ' ' + argument1;
    if (!opt_dropParens) {
      code = '(' + code + ')';
    }
  }
  return code;
};

Blockly.Dart.math_change = function() {
  // Add to a variable in place.
  var argument0 = Blockly.Dart.valueToCode_(this, 0, true) || '0';
  var varName = Blockly.Dart.variableDB_.getName(this.getTitleText(1),
			Blockly.Variables.NAME_TYPE);
  return varName + ' += ' + argument0 + ';\n';
};

Blockly.Dart.math_single = function(opt_dropParens) {
  // Math operators with single operand.
  var argNaked = Blockly.Dart.valueToCode_(this, 0, true) || '0';
  var argParen = Blockly.Dart.valueToCode_(this, 0, false) || '0';
	var argDartSafe = argNaked;
	if (!argDartSafe.match(/^[\w\.]+$/)) {
    // -4.abs() returns -4 in Dart due to strange order of operation choices.
    // Need to wrap non-trivial numbers in parentheses: (-4).abs()
    argDartSafe = '(' + argDartSafe + ')';
  }
  var operator = this.getValueLabel(0);
  var code;
  // First, handle cases which generate values that don't need parentheses.
  switch (operator) {
    case this.MSG_ABS:
      code = argDartSafe + '.abs()';
      break;
    case this.MSG_ROOT:
      code = 'Math.sqrt(' + argNaked + ')';
      break;
    case this.MSG_LN:
      code = 'Math.log(' + argNaked + ')';
      break;
    case this.MSG_EXP:
      code = 'Math.exp(' + argNaked + ')';
      break;
    case this.MSG_10POW:
      code = 'Math.pow(10,' + argNaked + ')';
    case this.MSG_ROUND:
			// Dart-safe parens not needed since -4.2.round() == (-4.2).round() 
      code = argParen + '.round()';
      break;
    case this.MSG_ROUNDUP:
      code = argDartSafe + '.ceil()';
      break;
    case this.MSG_ROUNDDOWN:
      operator = argDartSafe + '.floor()';
      break;
    case this.MSG_SIN:
      code = 'Math.sin(' + argParen + ' / 180 * Math.PI)';
      break;
    case this.MSG_COS:
      code = 'Math.cos(' + argParen + ' / 180 * Math.PI)';
      break;
    case this.MSG_TAN:
      code = 'Math.tan(' + argParen + ' / 180 * Math.PI)';
      break;
  }
  if (code) {
    return code;
  }
  // Second, handle cases which generate values that may need parentheses.
  switch (operator) {
    case this.MSG_NEG:
      code = '-' + argParen;
      break;
    case this.MSG_LOG10:
      code = 'Math.log(' + argNaked + ') / Math.log(10)';
      break;
    case this.MSG_ASIN:
      code = 'Math.asin(' + argNaked + ') / Math.PI * 180';
      break;
    case this.MSG_ACOS:
      code = 'Math.acos(' + argNaked + ') / Math.PI * 180';
      break;
    case this.MSG_ATAN:
      code = 'Math.atan(' + argNaked + ') / Math.PI * 180';
      break;
    default:
      throw 'Unknown math operator.';
  }
  if (!opt_dropParens) {
    code = '(' + code + ')';
  }
  return code;
};

// Rounding functions have a single operand.
Blockly.Dart.math_round = Blockly.Dart.math_single;
// Trigonometry functions have a single operand.
Blockly.Dart.math_trig = Blockly.Dart.math_single;

Blockly.Dart.math_on_list = function() {
  // Rounding functions.
  func = this.getTitleText(0);
  list = Blockly.Dart.valueToCode_(this, 0, true) || '[]';
  var code;
  switch (func) {
    case this.MSG_SUM:
      code = list + '.reduce(function(x, y) {return x + y;})';
      break;
    case this.MSG_MIN:
      code = 'Math.min.apply(null,' + list + ')';
      break;
    case this.MSG_MAX:
      code = 'Math.max.apply(null,' + list + ')';
      break;
    case this.MSG_AVERAGE:
      code = '(' + list + '.reduce(function(x, y) {return x + y;})/' + list +
      '.length)';
      break;
    case this.MSG_MEDIAN:
      if (!Blockly.Dart.definitions_['math_median']) {
        // Median is not a native Dart function.  Define one.
        // May need to handle null. 
        // Currently math_median([null,null,1,3]) == 0.5.
        var functionName = Blockly.Dart.variableDB_.getDistinctName('math_median',
						Blockly.Generator.NAME_TYPE);
        Blockly.Dart.math_on_list.median = functionName;
        var func = [];
        func.push('num ' + functionName + '(list) {');
        func.push('  if (!list.length) return 0;');
        func.push('  List<num> localList = [].concat(list);');
        func.push('  localList.sort(function(a, b) {return b - a;});');
        func.push('  if (localList.length % 2 == 0) {');
        func.push('    return (localList[localList.length / 2 - 1] + localList[localList.length / 2]) / 2;');
        func.push('  } else {');
        func.push('    return localList[(localList.length - 1) / 2];');
        func.push('  }');
        func.push('}');
        Blockly.Dart.definitions_['math_median'] = func.join('\n');
      }
      code = Blockly.Dart.math_on_list.median + '(' + list + ')';
      break;
    case this.MSG_MODE:
      if (!Blockly.Dart.definitions_['math_mode']) {
        // As a list of numbers can contain more than one mode,
        // the returned result is provided as an array.
        // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1].
        var functionName = Blockly.Dart.variableDB_.getDistinctName('math_mode',
						Blockly.Generator.NAME_TYPE);
        Blockly.Dart.math_on_list.mode = functionName;
        var func = [];
        func.push('var ' + functionName + '(values) {');
        func.push('  List modes = [];');
        func.push('  List<int> counts = [];');
        func.push('  int maxCount = 0;');
        func.push('  for (int i = 0; i < values.length; i++) {');
        func.push('    var value = values[i];');
        func.push('    bool found = false;');
        func.push('    int thisCount;');
        func.push('    for (int j = 0; j < counts.length; j++) {');
        func.push('      if (counts[j][0] === value) {');
        func.push('        thisCount = ++counts[j][1];');
        func.push('        found = true;');
        func.push('        break;');
        func.push('      }');
        func.push('    }');
        func.push('    if (!found) {');
        func.push('      counts.push([value, 1]);');
        func.push('      thisCount = 1;');
        func.push('    }');
        func.push('    maxCount = Math.max(thisCount, maxCount);');
        func.push('  }');
        func.push('  for (var j = 0; j < counts.length; j++) {');
        func.push('    if (counts[j][1] == maxCount) {');
        func.push('        modes.push(counts[j][0]);');
        func.push('    }');
        func.push('  }');
        func.push('  return modes;');
        func.push('}');
        Blockly.Dart.definitions_['math_mode'] = func.join('\n');
      }
      code = Blockly.Dart.math_on_list.mode + '(' + list + ')';
      break;
    case this.MSG_STD_DEV:
			// TODO
      code = 'Math.max.apply(null,' + list + ')';
      break;
    case this.MSG_RANDOM_ITEM:
			// TODO
      code = 'Math.max.apply(null,' + list + ')';
      break;
    default:
      throw 'Unknown operator.';
  }
  return code;
};

Blockly.Dart.math_modulo = function(opt_dropParens) {
  // Remainder computation.
  var argument0 = Blockly.Dart.valueToCode_(this, 0) || '0';
  var argument1 = Blockly.Dart.valueToCode_(this, 1) || '0';
  var code = argument0 + ' % ' + argument1;
  if (!opt_dropParens) {
    code = '(' + code + ')';
  }
  return code;
};

Blockly.Dart.math_random_float = function() {
  return 'Math.random()';
};

Blockly.Dart.math_random_int = function() {
  var argument0 = Blockly.Dart.valueToCode_(this, 0) || '0';
  var argument1 = Blockly.Dart.valueToCode_(this, 1) || '0';
  var rand1 = '(Math.random()*(' + argument1 + '-' + argument0 + '+1' + ')+' + argument0 + ').floor()';
  var rand2 = '(Math.random()*(' + argument0 + '-' + argument1 + '+1' + ')+' + argument1 + ').floor()';
  var code;
  if (argument0.match(/^[\d\.]+$/) && argument1.match(/^[\d\.]+$/)) {
    if (parseFloat(argument0) < parseFloat(argument1)) {
      code = rand1;
    } else {
      code = rand2;
    }
  } else {
    code = argument0 + ' < ' + argument1 + ' ? ' + rand1 + ' : ' + rand2;
  }
  return code;
};
