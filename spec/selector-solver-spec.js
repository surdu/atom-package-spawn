var SelectorSolver = require("../lib/selector-solver");
var path = require('path');
var fs = require('fs');

describe("selector-to-tab", function () {

	var editor;
	var editorView;
	var workspaceElement;

	function pressTab() {
		var event = atom.keymaps.constructor.buildKeydownEvent("tab", {target: editorView});
		atom.keymaps.handleKeyboardEvent(event);
	}

	function testSelector(selector, expected, expectedCurPos) {
		editor.setText(selector);
		editor.moveToEndOfLine();

		atom.commands.dispatch(editorView, 'selector-to-tag:solve-selector');

		expect(editor.getText()).toBe(expected);

		if (expectedCurPos) {
			expect(editor.getCursorScreenPosition()).toEqual(expectedCurPos);
		}
	}

	beforeEach(function () {

		waitsForPromise(function () {
			return atom.workspace.open('test.html');
		});

		waitsForPromise(function () {
			return atom.packages.activatePackage("selector-to-tag");
		});

		runs(function () {
			editor = atom.workspace.getActiveTextEditor();
			editorView = atom.views.getView(editor);
		});
	});

	describe("HTML detector", function () {
		var solver;

		beforeEach(function () {
			solver = new SelectorSolver();
		});

		it("should handle files with no extension", function () {
			expect(solver.isHTML("untitled")).toBe(false);
		});

		it("should detect HTML files", function () {
			expect(solver.isHTML("test.HTML")).toBe(true);
		});
	});

	describe("Tag solver", function () {

		beforeEach(function () {
			atom.config.unset('selector-to-tag.closeSelfclosingTags');
			atom.config.unset('selector-to-tag.expandBlockTags');
		});

		it("should solve block tags", function () {
			testSelector("div", '<div></div>', [0, 5]);
		});

		it("should solve inline tags", function () {
			testSelector("link", '<link>', [0, 5]);
		});

		it("should solve unknown tags", function () {
			testSelector("ceva", '<ceva></ceva>', [0, 6]);
		});

		it("should solve tag with id", function () {
			testSelector("div#mama", '<div id="mama"></div>', [0, 15]);
		});

		it("should solve tag with id and class", function () {
			testSelector("div#mama.tata", '<div id="mama" class="tata"></div>', [0, 28]);
		});

		it("should solve tag with id and multiple classes", function () {
			testSelector("div#mama.tata.sora", '<div id="mama" class="tata sora"></div>', [0, 33]);
		});

		it("should solve selectors containing - and _", function () {
			testSelector("some-tag_1#id-1_2.class_1.class-2", '<some-tag_1 id="id-1_2" class="class_1 class-2"></some-tag_1>', [0, 48]);
		});

		it("should solve self-closing tags", function () {
			atom.config.set('selector-to-tag.closeSelfclosingTags', true);
			testSelector("link", '<link/>', [0, 5]);
		});

		it("should expand block tags to multiple lines", function () {
			atom.config.set('selector-to-tag.expandBlockTags', true);
			testSelector("div#mama", '<div id="mama">\n\n</div>', [1, 0]);
		});

		it("shouldn't expand tag if class or id is not specified", function () {
			testSelector("div#", 'div#');
			testSelector("div.", 'div.');
		});

		it("should solve to div if only class or id specified", function () {
			testSelector("#mama", '<div id="mama"></div>', [0, 15]);
			testSelector(".tata", '<div class="tata"></div>', [0, 18]);
		});

		it("should not solve to div if nothing is specified", function () {
			testSelector("", '');
		});

		it("should not create tags from invalid strings", function () {
			testSelector("42", '42');
		});

		it("should not solve strings in incorrect position", function () {
			editor.setText('<input type="button|" name="name" value="">');
			editor.moveToEndOfLine();

			atom.commands.dispatch(editorView, 'selector-to-tag:solve-selector');

			expect(editor.getText()).toBe(expected);

			if (expectedCurPos) {
				expect(editor.getCursorScreenPosition()).toEqual(expectedCurPos);
			}
		});
	});
});
