(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define(['acorn', 'astgen', 'escodegen', 'estraverse'], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory.call({}, require('acorn'), require('astgen'), require('escodegen'), require('estraverse'));
	} else {
		root.jspp = factory.call({}, root.acorn, root.astgen, root.escodegen, root.estraverse);
	}
})(this, function (acorn, astgen, escodegen, estraverse) {

	'use strict';

	var arrayExpression = astgen.arrayExpression;
	var arrayPattern = astgen.arrayPattern;
	var arrowExpression = astgen.arrowExpression;
	var assignmentExpression = astgen.assignmentExpression;
	var binaryExpression = astgen.binaryExpression;
	var blockStatement = astgen.blockStatement;
	var breakStatement = astgen.breakStatement;
	var callExpression = astgen.callExpression;
	var catchClause = astgen.catchClause;
	var comprehensionBlock = astgen.comprehensionBlock;
	var comprehensionExpression = astgen.comprehensionExpression;
	var conditionalExpression = astgen.conditionalExpression;
	var continueStatement = astgen.continueStatement;
	var debuggerStatement = astgen.debuggerStatement;
	var doWhileStatement = astgen.doWhileStatement;
	var emptyStatement = astgen.emptyStatement;
	var expressionStatement = astgen.expressionStatement;
	var forStatement = astgen.forStatement;
	var forInStatement = astgen.forInStatement;
	var forOfStatement = astgen.forOfStatement;
	var functionDeclaration = astgen.functionDeclaration;
	var functionExpression = astgen.functionExpression;
	var generatorExpression = astgen.generatorExpression;
	var identifier = astgen.identifier;
	var ifStatement = astgen.ifStatement;
	var labeledStatement = astgen.labeledStatement;
	var literal = astgen.literal;
	var logicalExpression = astgen.logicalExpression;
	var memberExpression = astgen.memberExpression;
	var newExpression = astgen.newExpression;
	var objectExpression = astgen.objectExpression;
	var objectPattern = astgen.objectPattern;
	var position = astgen.position;
	var program = astgen.program;
	var property = astgen.property;
	var propertyPattern = astgen.propertyPattern;
	var returnStatement = astgen.returnStatement;
	var sequenceExpression = astgen.sequenceExpression;
	var sourceLocation = astgen.sourceLocation;
	var switchCase = astgen.switchCase;
	var switchStatement = astgen.switchStatement;
	var thisExpression = astgen.thisExpression;
	var throwStatement = astgen.throwStatement;
	var tryStatement = astgen.tryStatement;
	var unaryExpression = astgen.unaryExpression;
	var updateExpression = astgen.updateExpression;
	var variableDeclaration = astgen.variableDeclaration;
	var variableDeclarator = astgen.variableDeclarator;
	var whileStatement = astgen.whileStatement;
	var withStatement = astgen.withStatement;
	var yieldExpression = astgen.yieldExpression;

	function compileRestParameter (node) {
		if (node.rest === null) return node;

		var rest = node.rest.name;
		node.rest = null;
		var length = node.params.length;
		node.body.body.unshift(variableDeclaration(
			'var',
			[ variableDeclarator(
				identifier(rest),
				callExpression(
					memberExpression(
						memberExpression(
							memberExpression(
								identifier('Array'),
								identifier('prototype'),
								false
							),
							identifier('slice'),
							false
						),
						identifier('call'),
						false
					),
					[
						identifier('arguments'),
						literal(length)
					]
				)
			) ]
		));
		return node;
	}

	function compileAutomaticReturn (node) {
		var body = node.body.body; // Function.body/BlockStatement.body

		if (!body.length ||
			body[body.length - 1].type !== 'ExpressionStatement')
			return node;

		body[body.length - 1] = returnStatement(
			astgen.validate(
				body[body.length - 1].expression
			)
		);

		return node;
	}

	var compile = function (src) {
		var ast = acorn.parse(src);
		ast = estraverse.replace(ast, {
			enter: function (node) {
				var res = node;
				switch (node.type) {
					case 'FunctionExpression': // Fall through
					case 'FunctionDeclaration':
						res = compileRestParameter(res);
						res = compileAutomaticReturn(res);
				}
				return res;
			}
		});
		return escodegen.generate(ast);
	};

	return {
		compile: compile
	};

});
