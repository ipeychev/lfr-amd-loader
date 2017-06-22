define('issue-140/m1', ['module', 'require', 'issue-140/a'], function(
	module,
	require,
	a
) {
	module.exports = function() {
		try {
			return require('issue-140/a');
		} catch (err) {
			return err;
		}
	};
});
