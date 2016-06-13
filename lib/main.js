
module.exports = {

	config: {
	},

	activate: function(state) {
		atom.commands.add('atom-text-editor', {
				'selector-to-tag:ceva': function () {
					console.log("tada!");
				}
		});
	}
};
