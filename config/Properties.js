const yaml = require('js-yaml');
const fs = require('fs');

module.exports = {
		getProperties : function(){
				return this.parsedProperties;
		},

		setProperties: function(fileName){
				this.parsedProperties = yaml.safeLoad(fs.readFileSync(fileName, 'utf8'));
		}
};