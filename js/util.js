window.utility = (function() {
  
  let SELF = {
    GenerateUUID,
  };
  
  function GenerateUUID() {
    return UUIDv4.Generate();
  }
  
  let UUIDv4 = (function() {
    
  	function generateNumber(limit) {
  	   let value = limit * Math.random();
  	   return value | 0;
  	}
  	function generateX() {
  		let value = generateNumber(16);
  		return value.toString(16);
  	}
  	function generateXes(count) {
  		let result = '';
  		for(let i = 0; i < count; ++i) {
  			result += generateX();
  		}
  		return result;
  	}
  	function generateVariant() {
  		let value = generateNumber(16);
  		let variant = (value & 0x3) | 0x8;
  		return variant.toString(16);
  	}
  	
    // UUID v4
    //   varsion: M=4 
    //   variant: N
    //   pattern: xxxxxxxx-xxxx-Mxxx-Nxxx-xxxxxxxxxxxx
    //
    function Generate() {
	    let result = generateXes(8) + '-' + generateXes(4) + '-' + '4' + generateXes(3) + '-' + generateVariant() + generateXes(3) + '-' + generateXes(12);
	    return result;
  	}
  	
  	return {
  	  Generate,
  	};
  	
  })();
  
  return SELF;
  
})();

// Fuse.js options
const options = {
  keys: ['title', 'description'], // Fields to search
  includeMatches: true, // Include matched indices and value
  threshold: 0.7 // Minimum score for a match (0.0 to 1.0)
};

async function search(keyword) {
  
  if (keyword.trim().length == 0) {
    return null;
  }
  
  let gogo = [];
  
  
  const fuse = new Fuse(data, options);
  const results = fuse.search(keyword);

  for (let i = 0; i < results.length; i++) {
    const { item, matches } = results[i];
    let modifData = {
      id: item.id,
      title: item.title,
      description: item.description,
      labelsName: (await compoNotes.GetLabelsNameById(item.labels)),
    };
    gogo.push(modifData);

    for (let j = 0; j < matches.length; j++) {
      const { key, indices } = matches[j];

      for (let k = 0; k < indices.length; k++) {
        const [start, end] = indices[k];
        const markedText = item[key].substring(start, end + 1);
        const markedValue = `<mark>${markedText}</mark>`;
        modifData[key] = item[key].substring(0, start) + markedValue + item[key].substring(end + 1);
      }
    }
  }
  
  return gogo;
}