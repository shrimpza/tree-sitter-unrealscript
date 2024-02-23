// with pieces and references from:
//  - https://github.com/tree-sitter/tree-sitter-javascript/blob/master/grammar.js
//  - https://github.com/tree-sitter/tree-sitter-java/blob/master/grammar.js
//  - https://github.com/stadelmanma/tree-sitter-fortran/blob/master/grammar.js

module.exports = grammar({
	name: 'unrealscript',

	extras: $ => [
		$.comment,
		/\s/,
	],

	supertypes: $ => [
		$.statement,
		$.declaration,
		$.expression,
		$.primary_expression,
		// $.pattern,
	],

	inline: $ => [
		// $._call_signature,
		// $._formal_parameter,
		$.statement,
		$._expressions,
		$._identifier,
		$._lhs_expression
	],

	precedences: $ => [
		[
			'member',
			'call',
			$.update_expression,
			'unary_void',
			'binary_exp',
			'binary_times',
			'binary_plus',
			'binary_shift',
			'binary_compare',
			'binary_relation',
			'binary_equality',
			'bitwise_and',
			'bitwise_xor',
			'bitwise_or',
			'logical_and',
			'logical_or',
			'concat_spaces',
			'concat',
			$._statement
		],
		['assign', $.primary_expression],
		['member', 'new', 'call', $.expression],
		['declaration', 'literal'],
		[$.primary_expression, $.block],
		// [$.return_statement, $.expression_statement],
		// [$.import_statement, $.import],
		// [$.export_statement, $.primary_expression],
		// [$.variable_declaration, $.primary_expression],
		// [$.declaration, $.expression_statement],
		[$.number, $.array_identifier, $._identifier],
		[$.nested_identifier, $.member_expression],
	],

	conflicts: $ => [
		[$.primary_expression, $.array_identifier],
		// [$.for_statement, $.expression],
		// [$.primary_expression, $._property_name, $.arrow_function],
		// [$.primary_expression, $.arrow_function],
		// [$.primary_expression, $.method_definition],
		// [$.primary_expression, $.rest_pattern],
		// [$.primary_expression, $.pattern],
		// [$.primary_expression, $._for_header],
		// [$.array, $.array_pattern],
		// [$.object, $.object_pattern],
		// [$.assignment_expression, $.pattern],
		// [$.assignment_expression, $.object_assignment_pattern],
		// [$.labeled_statement, $._property_name],
		// [$.computed_property_name, $.array],
		// [$.binary_expression, $._initializer],
	],

	word: $ => $.identifier,

	rules: {
		program: $ => repeat($.statement),

		declaration: $ => choice(
			$.class_declaration,
			$.function_declaration,
			$.variable_declaration,
			$.enum_declaration
		),

		class_declaration: $ => seq(
			caseInsensitive('class'),
			field('name', $.identifier),
			optional($.class_heritage),
			commaSep($.class_modifier),
			';',
		),

		function_declaration: $ => seq(
			repeat($.function_modifier),
			choice(caseInsensitive('function'), caseInsensitive('event')),
			optional(field('return_type', $.type)),
			field('name', $.identifier),
			field('parameters', $.function_parameters),
			choice(field('body', $.block), ';'),
		),

		if_statement: $ => prec.right(seq(
			'if',
			field('condition', $.condition),
			field('consequence', $.statement),
			optional(seq('else', field('alternative', $.statement))),
		)),

		condition: $ => seq('(', $.expression, ')'),

		for_statement: $ => seq(
			caseInsensitive('for'), '(',
			field('init', $.assignment_expression), ';',
			field('condition', $.expression), ';',
			field('update', $.expression), ')',
			field('body', $.statement),
		),

		while_statement: $ => seq(
			caseInsensitive('while'), '(',
			field('condition', $.expression), ')',
			field('body', $.statement),
		),

		do_until_statement: $ => seq(
			caseInsensitive('do'),
			field('body', $.statement),
			caseInsensitive('until'), '(', field('condition', $.expression), ')',
			';',
		),

		return_statement: $ => seq(
			caseInsensitive('return'),
			optional($.expression),
			';'
		),

		continue_statement: $ => seq(
			caseInsensitive('continue'),
			';'
		),

		break_statement: $ => seq(
			caseInsensitive('break'),
			';'
		),

		assert_statement: $ => seq(
			caseInsensitive('assert'), '(', field('condition', $.expression), ')',
			';'
		),

		constant_declaration: $ => seq(
			caseInsensitive('const'),
			$.assignment_expression,
			';',
		),

		enum_declaration: $ => seq(
			caseInsensitive('enum'),
			field('name', $.identifier),
			field('body', $.enum_body)
		),
		enum_body: $ => seq(
			'{',
			commaSep1($.identifier),
			optional(','),
			'}'
		),

		variable_declaration: $ => seq(
			choice(
				$._class_variable_declaration,
				$._enum_variable_declaration,
			),
			';',
		),

		_class_variable_declaration: $ => seq(
			caseInsensitive('var'),
			field('editgroups', optional(seq('(', commaSep($._identifier), ')'))),
			optional($.variable_modifier),
			field('type', $.type),
			commaSep1(field('name', $._identifier)),
		),

		_enum_variable_declaration: $ => seq(
			caseInsensitive('var'),
			field('editorgroups', optional(seq('(', commaSep($._identifier), ')'))),
			optional($.variable_modifier),
			$.enum_declaration,
			commaSep1(field('name', $._identifier))
		),

		local_variable_declaration: $ => seq(
			caseInsensitive('local'),
			field('type', $.type),
			commaSep1(field('name', $._identifier)),
			';',
		),

		_config_modifier: $ => seq(
			caseInsensitive('config'),
			optional(seq(
				'(',
				optional($.identifier),
				')'
			)),
		) ,

		_class_depends_modifier: $ => seq(
			caseInsensitive('dependson'),
			optional(seq(
				'(',
				$.identifier,
				')'
			)),
		),

		_class_within_modifier: $ => seq(
			caseInsensitive('within'),
			$.identifier,
		),

		_class_display_categories_modifier: $ => seq(
			choice(caseInsensitive('hidecategories'), caseInsensitive('showcategories')),
			optional(seq(
				'(',
				commaSep($.identifier),
				')'
			)),
		),

		class_modifier: $ => choice(
			caseInsensitive('abstract'),
			caseInsensitive('notplaceable'),
			caseInsensitive('native'),
			choice(caseInsensitive('nativereplication'), caseInsensitive('nonativereplication')),
			caseInsensitive('safereplace'),
			caseInsensitive('perobjectconfig'),
			caseInsensitive('transient'),
			caseInsensitive('noexport'),
			caseInsensitive('exportstructs'),
			caseInsensitive('cacheexempt'),
			caseInsensitive('hidedropdown'),
			caseInsensitive('parseconfig'),
			caseInsensitive('instanced'),
			choice(caseInsensitive('collapsecategories'), caseInsensitive('dontcollapsecategories')),
			choice(caseInsensitive('placeable'), caseInsensitive('notplaceable')),
			choice(caseInsensitive('editinlinenew'), caseInsensitive('noteditinlinenew')),
			$._config_modifier,
			$._class_depends_modifier,
			$._class_within_modifier,
			$._class_display_categories_modifier
		),

		variable_modifier: $ => choice(
			caseInsensitive('static'),
			caseInsensitive('private'),
			caseInsensitive('public'),
			caseInsensitive('protected'),
			caseInsensitive('const'),
			caseInsensitive('transient'),
			caseInsensitive('deprecated'),
			caseInsensitive('input'),
			caseInsensitive('localized'),
			caseInsensitive('travel'),
			$._config_modifier,
		),

		function_modifier: $ => choice(
			caseInsensitive('static'),
			caseInsensitive('private'),
			caseInsensitive('protected'),
			caseInsensitive('simulated'),
			caseInsensitive('singular'),
			caseInsensitive('native'),
			caseInsensitive('final'),
			caseInsensitive('latent'),
			caseInsensitive('iterator'),
			caseInsensitive('exec'),
		),

		parameter_modifier: $ => choice(
			caseInsensitive('out'),
			caseInsensitive('optional'),
			caseInsensitive('coerce'),
			caseInsensitive('skip'),
		),

		function_parameters: $ => seq(
			'(',
			commaSep(
				seq(
					optional($.parameter_modifier),
					field('type', $.type),
					field('name', $.identifier),
				)
			),
			')'
		),

		class_heritage: $ => seq(
			choice(caseInsensitive('extends'), caseInsensitive('expands')),
			field('parent', $.identifier)
		),

		block: $ => prec.right(seq(
			'{',
			repeat($._statement),
			'}'
		)),

		_statement: $ => choice(
			$.local_variable_declaration,
			$.statement,
		),

		statement: $ => choice(
			$.block,
			$.declaration,
			$.expression_statement,
			$.if_statement,
			$.for_statement,
			$.while_statement,
			$.do_until_statement,
			$.continue_statement,
			$.break_statement,
			$.assert_statement,
			$.return_statement,
			$.constant_declaration,
		),

		expression_statement: $ => seq(
			$._expression,
			';',
		),

		arguments: $ => seq(
			'(',
			commaSep(optional($.expression)),
			')',
		),

		expression: $ => choice(
			$.primary_expression,
			$.assignment_expression,
			$.augmented_assignment_expression,
			$.unary_expression,
			$.binary_expression,
			$.update_expression,
			$.string_expression,
			$.new_expression,
		),

		primary_expression: $ => choice(
			$.subscript_expression,
			$.member_expression,
			$.parenthesized_expression,
			$.self,
			$.super,
			$.number,
			$.string,
			$.true,
			$.false,
			$.name,
			$._identifier,
		),

		_expression: $ => choice(
			$.expression,
		),
		_lhs_expression: $ => choice(
			$.member_expression,
			$.subscript_expression,
			$._identifier,
		),
		assignment_expression: $ => prec.right('assign', seq(
			field('left', choice($.parenthesized_expression, $._lhs_expression)),
			'=',
			field('right', $.expression),
		)),
		_augmented_assignment_lhs: $ => choice(
			$.member_expression,
			$.subscript_expression,
			$.identifier,
			$.parenthesized_expression,
		),
		augmented_assignment_expression: $ => prec.right('assign', seq(
			field('left', $._augmented_assignment_lhs),
			field('operator', choice('+=', '-=', '*=', '/=', '%=', '^=', '&=', '|=', '>>=', '>>>=',
				'<<=', '**=', '&&=', '||=', '??=')),
			field('right', $.expression),
		)),
		new_expression: $ => prec.right('new', seq(
			'new',
			field('constructor', choice($.primary_expression, $.new_expression)),
			field('arguments', optional(prec.dynamic(1, $.arguments))),
		)),

		binary_expression: $ => choice(
			...[
				['&&', 'logical_and'],
				['||', 'logical_or'],
				['>>', 'binary_shift'],
				['<<', 'binary_shift'],
				['&', 'bitwise_and'],
				['^', 'bitwise_xor'],
				['|', 'bitwise_or'],
				['+', 'binary_plus'],
				['-', 'binary_plus'],
				['*', 'binary_times'],
				['/', 'binary_times'],
				['%', 'binary_times'],
				['**', 'binary_exp', 'right'],
				['<', 'binary_relation'],
				['<=', 'binary_relation'],
				['==', 'binary_equality'],
				['!=', 'binary_equality'],
				['>=', 'binary_relation'],
				['>', 'binary_relation'],
			].map(([operator, precedence, associativity]) =>
				(associativity === 'right' ? prec.right : prec.left)(precedence, seq(
					field('left', $.expression),
					field('operator', operator),
					field('right', $.expression),
				)),
			),
		),

		unary_expression: $ => choice(...[
			['+', 10],
			['-', 10],
			['!', 10],
			['~', 10],
		].map(([operator, precedence]) =>
			prec.left(precedence, seq(
				field('operator', operator),
				field('operand', $.expression)
			))
		)),

		update_expression: $ => prec.left(choice(
			seq(
				field('argument', $.expression),
				field('operator', choice('++', '--')),
			),
			seq(
				field('operator', choice('++', '--')),
				field('argument', $.expression),
			),
		)),

		string_expression: $ => choice(
			...[
				['@', 'concat_spaces'],
				['$', 'concat'],
			].map(([operator, precedence]) =>
				prec.left(precedence, seq(
					field('left', $.expression),
					field('operator', operator),
					field('right', $.expression),
				)),
			),
		),

		type: $ => choice(
			$.primitive_type,
			$.native_type,
			$.identifier,
		),

		primitive_type: $ => choice(
			caseInsensitive('bool'),
			caseInsensitive('byte'),
			caseInsensitive('int'),
			caseInsensitive('float'),
			caseInsensitive('string'),
		),

		native_type: $ => choice(
			caseInsensitive('vector'),
			caseInsensitive('rotator'),
		),

		_identifier: $ => choice(
			$.none,
			$.identifier,
			$.array_identifier,
			$.nested_identifier
		),

		identifier: $ => /[A-Za-z_]([A-Za-z0-9_]+)?/,

		array_identifier: $ => prec.right(seq(
			$._identifier,
			$.array_dimensions,
		)),

		array_dimensions: $ => prec.right(repeat1(
			seq('[', field('size', choice($.identifier, $._integer)), ']')
		)),

		self: _ => caseInsensitive('self'),
		super: _ => caseInsensitive('super'),
		true: _ => caseInsensitive('true'),
		false: _ => caseInsensitive('false'),
		none: _ => caseInsensitive('none'),

		string: $ => seq(
			'"',
			repeat(choice(
				alias($.unescaped_double_string_fragment, $.string_fragment),
				$.escape_sequence,
			)),
			'"',
		),
		unescaped_double_string_fragment: _ => token.immediate(prec(1, /[^"\\\r\n]+/)),
		unescaped_single_string_fragment: _ => token.immediate(prec(1, /[^'\\\r\n]+/)),
		escape_sequence: _ => token.immediate('\\'),
		name: $ => seq(
			'\'',
			$._identifier,
			'\'',
		),

		_integer: $ => token(/\d+/),

		number: $ => {
			const hex_literal = seq(
				choice('0x', '0X'),
				/[\da-fA-F](_?[\da-fA-F])*/,
			);
			const decimal_digits = /\d+/;
			const signed_integer = seq(optional(choice('-', '+')), decimal_digits);
			const exponent_part = seq(choice('e', 'E'), signed_integer);
			const decimal_integer_literal = choice(
				'0',
				seq(optional('0'), /[1-9]/, optional(seq(optional('_'), decimal_digits))),
			);
			const decimal_literal = choice(
				seq(decimal_integer_literal, '.', optional(decimal_digits), optional(exponent_part)),
				seq('.', decimal_digits, optional(exponent_part)),
				seq(decimal_integer_literal, exponent_part),
				seq(decimal_digits),
			);
			return token(prec.left(choice(
				hex_literal,
				decimal_literal,
				signed_integer
			)));
		},

		member_expression: $ => prec('member', seq(
			field('object', choice($.identifier)),
			'.',
			field('property', alias($.identifier, $.property_identifier)),
		)),
		nested_identifier: $ => prec('member', seq(
			field('object', choice($.identifier, alias($.nested_identifier, $.member_expression))),
			'.',
			field('property', alias($.identifier, $.property_identifier)),
		)),
		subscript_expression: $ => prec.right('member', seq(
			field('object', choice($.expression, $.primary_expression)),
			'[', field('index', $._expression), ']',
		)),
		parenthesized_expression: $ => seq(
			'(',
			$._expression,
			')',
		),

		comment: _ => choice(
			token(choice(
				seq('//', /.*/),
				seq(
					'/*',
					/[^*]*\*+([^/*][^*]*\*+)*/,
					'/',
				),
			)),
		),
	}
});

/** stolen from FORTRAN xD */
function caseInsensitive (keyword, aliasAsWord = true) {
	let result = new RegExp(keyword
		.split('')
		.map(l => l !== l.toUpperCase() ? `[${l}${l.toUpperCase()}]` : l)
		.join('')
	)
	if (aliasAsWord) result = alias(result, keyword)
	return result
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {SeqRule}
 *
 */
function commaSep1(rule) {
	return seq(rule, repeat(seq(',', rule)));
}

/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @return {ChoiceRule}
 *
 */
function commaSep(rule) {
	return optional(commaSep1(rule));
}