const fs = require('fs');
const fsExtra = require('fs-extra');

let dependencies = [
  {
    source: 'node_modules/@tmp7/view-state-util',
    destination: 'js/vendors/view-state-util',
  }, 
  {
    source: 'node_modules/@tmp7/windog',
    destination: 'js/vendors/windog',
  }, 
];


for (let item of dependencies) {

  // Copy files from source to destination directory
  try {

    fsExtra.removeSync(item.destination);
    fsExtra.mkdirSync(item.destination, { recursive: true });

    if (item.files) {
      // Copy specified files individually
      for (let file of item.files) {
        const sourcePath = `${item.source}${file}`;
        const destinationPath = `${item.destination}${file}`;

        fsExtra.copySync(sourcePath, destinationPath);
        console.log(`File '${file}' copied successfully.`);
      }
    } else {
      // Copy entire directory if no specific files are listed
      fsExtra.copySync(item.source, item.destination);
      console.log('Directory copied successfully.');
    }

  } catch (error) {
    console.error(`Error copying directory: ${error}`);
  }

}
