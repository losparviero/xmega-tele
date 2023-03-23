const Downloader = require("nodejs-file-downloader");

(async () => {
  //Wrapping the code with an async function, just for the sake of example.

  const downloader = new Downloader({
    url: "https://www.xmegadrive.com/get_file/1/b63f91bb61193f4c68b7dd4b71416ded60c97a6885/155000/155686/155686.mp4/?rnd=1679558458767", //If the file name already exists, a new file with the name 200MB1.zip is created.
    directory: "./downloads", //This folder will be created, if it doesn't exist.
    onBeforeSave: (deducedName) => {
      console.log(`The file name is: ${deducedName}`);
      //If you return a string here, it will be used as the name(that includes the extension!).
    },
  });
  try {
    const { filePath, downloadStatus } = await downloader.download(); //Downloader.download() resolves with some useful properties.

    console.log("All done");
  } catch (error) {
    //IMPORTANT: Handle a possible error. An error is thrown in case of network errors, or status codes of 400 and above.
    //Note that if the maxAttempts is set to higher than 1, the error is thrown only if all attempts fail.
    console.log("Download failed", error);
  }
})();
