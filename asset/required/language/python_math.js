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
 * @fileoverview Generating Python for math blocks.
 * @author fraser@google.com (Neil Fraser)
 * Due to the frequency of long strings, the 80-column wrap rule need not apply
 * to language files.
 */

Blockly.Python = Blockly.Generator.get('Python');

Blockly.Python.math_number = function() {
  // Numeric value.
  return window.parseFloat(this.getTitleText(0));
};

Blockly.Python.math_arithmetic = function(opt_dropParens) {
  // Basic arithmetic operators, and power.
  var argument0 = Blockly.Python.valueToCode_(this, 0) || '0';
  var argument1 = Blockly.Python.valueToCode_(this, 1) || '0';
  var map = {};
  map[this.MSG_ADD] = '+';
  map[this.MSG_MINUS] = '-';
  map[this.MSG_MULTIPLY] = '*';
  map[this.MSG_DIVIDE] = '/';
  map[this.MSG_POWER] = '**';
  var operator = map[this.getValueLabel(1)];
  var code = argument0 + ' ' + operator + ' ' + argument1;
  if (!opt_dropParens) {
    code = '(' + code + ')';
  }
  return code;
};

Blockly.Python.math_change = function() {
  // Add to a variable in place.
  var argument0 = Blockly.Python.valueToCode_(this, 0, true) || '0';
  var varName = Blockly.Python.variableDB_.getName(this.getTitleText(1),
      Blockly.Variables.NAME_TYPE);
  return varName + ' = (' + varName + ' or 0) + ' + argument0 + '\n';
};

Blockly.Python.math_single = function(opt_dropParens) {
  // Math operators with single operand.
  Blockly.Python.definitions_['import_math'] = 'import math';
  var argNaked = Blockly.Python.valueToCode_(this, 0, true) || '0';
  var argParen = Blockly.Python.valueToCode_(this, 0, false) || '0';
  var operator = this.getValueLabel(0);
  var code;
  // First, handle cases which generate values that don't need parentheses wrapping the code.
  switch (operator) {
    case this.MSG_ABS:
      code = 'math.fabs(' + argNaked + ')';
      break;
    case this.MSG_ROOT:
      code = 'math.sqrt(' + argNaked + ')';
      break;
    case this.MSG_LN:
      code = 'math.log(' + argNaked + ')';
      break;
    case this.MSG_LOG10:
      code = 'math.log10(' + argNaked + ')';
      break;
    case this.MSG_EXP:
      code = 'math.exp(' + argNaked + ')';
      break;
    case this.MSG_10POW:
      code = 'math.pow(10,' + argNaked + ')';
      break;
    case this.MSG_ROUND:
      code = 'round(' + argNaked + ')';
      break;
    case this.MSG_ROUNDUP:
      code = 'math.ceil(' + argNaked + ')';
      break;
    case this.MSG_ROUNDDOWN:
      code = 'math.floor(' + argNaked + ')';
      break;
    case this.MSG_SIN:
      code = 'math.sin(' + argParen + ' / 180 * Math.PI)';
      break;
    case this.MSG_COS:
      code = 'math.cos(' + argParen + ' / 180 * Math.PI)';
      break;
    case this.MSG_TAN:
      code = 'math.tan(' + argParen + ' / 180 * Math.PI)';
      break;
  }
  if (code) {
    return code;
  }
  // Second, handle cases which generate values that may need parentheses wrapping the code.
  switch (operator) {
    case this.MSG_NEG:
      code = '-' + argParen;
      break;
    case this.MSG_ASIN:
      code = 'math.asin(' + argNaked + ') / Math.PI * 180';
      break;
    case this.MSG_ACOS:
      code = 'math.acos(' + argNaked + ') / Math.PI * 180';
      break;
    case this.MSG_ATAN:
      code = 'math.atan(' + argNaked + ') / Math.PI * 180';
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
Blockly.Python.math_round = Blockly.Python.math_single;
// Trigonometry functions have a single operand.
Blockly.Python.math_trig = Blockly.Python.math_single;

Blockly.Python.math_on_list = function() {
  // Rounding functions.
  func = this.getTitleText(0);
  list = Blockly.Python.valueToCode_(this, 0, true) || '[]';
  var code;
  switch (func) {
    case this.MSG_SUM:
      code = 'sum(' + list + ')';
      break;
    case this.MSG_MIN:
      code = 'min(' + list + ')';
      break;
    case this.MSG_MAX:
      code = 'max(' + list + ')';
      break;
    case this.MSG_AVERAGE:
      code = list.length? 'sum(' + list + ') / len(' + list + ')' : 0;
      break;
    case this.MSG_MEDIAN:
      if (!Blockly.Python.definitions_['math_median']) {
        // Median is not a native Python function.  Define one.
        // May need to handle null. Currently math_median([null,null,1,3]) == 0.5.
        var functionName = Blockly.Python.variableDB_.getDistinctName('math_median',
            Blockly.Generator.NAME_TYPE);
        Blockly.Python.math_on_list.median = functionName;
        var func = [];
        func.push('def ' + functionName + '(list):');
        func.push('  if not list: return 0');
        func.push('  sortedL = sorted(list)');
        func.push('  if len(list) % 2 == 0):');
        func.push('    return (sortedL[len(list) / 2 - 1] + sortedL[len(list) / 2]) / 2');
        func.push('  else:');
        func.push('    return sortedL[(len(list) - 1) / 2]');
        Blockly.Python.definitions_['math_median'] = func.join('\n');
      }
      code = Blockly.Python.math_on_list.median + '(' + list + ')';
      break;
    case this.MSG_MODE:
      if (!Blockly.Python.definitions_['math_modes']) {
        // As a list of numbers can contain more than one mode,
        // the returned result is provided as an array.
        // Mode of [3, 'x', 'x', 1, 1, 2, '3'] -> ['x', 1].
        var functionName = Blockly.Python.variableDB_.getDistinctName('math_modes',
            Blockly.Generator.NAME_TYPE);
        Blockly.Python.math_on_list.math_modes = functionName;
        var func = [];
        func.push('def ' + functionName + '(some_list):');
        func.push('  modes = []');
        func.push('  # Using a lists of [item, count] to keep count rather than dict');
        func.push('  # to avoid "unhashable" errors when the counted item is itself a list or dict.');
        func.push('  counts = []');
        func.push('  maxCount = 1');
        func.push('  for item in some_list:');
        func.push('    found = False');
        func.push('    for count in counts:');
        func.push('      if count[0] == item:');
        func.push('        count[1] += 1');
        func.push('        maxCount = max(maxCount, count[1])');
        func.push('        found = True');
        func.push('    if not found:');
        func.push('      counts.append([item, 1])');
        func.push('  for counted_item, item_count in counts:');
        func.push('    if item_count == maxCount:');
        func.push('      modes.append(counted_item)');
        func.push('  return modes');
        Blockly.Python.definitions_['math_modes'] = func.join('\n');
      }
      code = Blockly.Python.math_on_list.math_modes + '(' + list + ')';
      break;
    case this.MSG_STD_DEV:
      Blockly.Python.definitions_['import_math'] = 'import math';
      if (!Blockly.Python.definitions_['math_standard_deviation']) {
        var functionName = Blockly.Python.variableDB_.getDistinctName('math_standard_deviation',
            Blockly.Generator.NAME_TYPE);
        Blockly.Python.math_on_list.math_standard_deviation = functionName;
        var func = [];
        func.push('def ' + functionName + '(numbers):');
        func.push('  n = len(numbers)');
        func.push('  if n == 0: return');
        func.push('  mean = sum(numbers)/n');
        func.push('  variance = float(sum((x - mean)**2 for x in numbers))/n');
        func.push('  standard_dev = math.sqrt(variance)');
        func.push('  return standard_dev');
        Blockly.Python.definitions_['math_standard_deviation'] = func.join('\n');
      }
      code = Blockly.Python.math_on_list.math_standard_deviation + '(' + list + ')';
      break;
    case this.MSG_RANDOM_ITEM:
      Blockly.Python.definitions_['import_random_choice'] = 'from random import choice';
      code = 'choice(' + list + ')';
      break;
    default:
      throw 'Unknown operator.';
  }
  return code;
};

Blockly.Python.math_modulo = function(opt_dropParens) {
  // Remainder computation.
  var argument0 = Blockly.Python.valueToCode_(this, 0) || '0';
  var argument1 = Blockly.Python.valueToCode_(this, 1) || '0';
  var code = argument0 + ' % ' + argument1;
  if (!opt_dropParens) {
    code = '(' + code + ')';
  }
  return code;
};

Blockly.Python.math_random_float = function() {
  Blockly.Python.definitions_['import_random'] = 'import random';
  return 'random.random()';
};

Blockly.Python.math_random_int = function() {
  Blockly.Python.definitions_['import_random'] = 'import random';
  var argument0 = Blockly.Python.valueToCode_(this, 0) || '0';
  var argument1 = Blockly.Python.valueToCode_(this, 1) || '0';
  var code = 'random.randint('+ argument0 + ', ' + argument1 + ')';
  return code;
};
