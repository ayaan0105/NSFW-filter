// Function to detect NSFW content using a pre-trained model
let model;
let pageNSFW = false;
let noOfImages = 0;
const hashset = new Set();
async function nsfw()
{
  if(!pageNSFW)
  {
    await blurMediaInIframes();
    // muteActiveTab();
    pageNSFW = true;
  }
}
async function loadModel() {
  try {
    model = await tf.loadLayersModel("https://raw.githubusercontent.com/GramThanos/NSFW-Image-Filter-Browser-Extension/master/dist/model/model.json");
  } catch (error) {
    console.error("Error loading model:", error);
  }
}

// Function to process a single media element (image or video)
async function processImage(mediaElement) {
  if (!model) {
    console.error("Model not loaded");
    return false;
  }
  mediaElement.setAttribute("crossOrigin", "anonymous");
  // console.log("waiting for image to load");
  await new Promise((resolve, reject) => {
    mediaElement.onload = resolve;
    mediaElement.onerror = reject;
  });
  // console.log("image loaded");
 
  // console.log(mediaElement);
  // Check if the element is an image or video

  // Create a canvas element to render the media for analysis
  const canvas = document.createElement("canvas");
  canvas.width = mediaElement.width || mediaElement.videoWidth || 0;
  canvas.height = mediaElement.height || mediaElement.videoHeight || 0;
  const context = canvas.getContext("2d");
  context.drawImage(mediaElement, 0, 0, canvas.width, canvas.height);
  // console.log(canvas.width, canvas.height);

  // Extract the image data from the canvas
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  // console.log(imageData);

  // Convert the image data to a tensor
  const imageTensor = tf.browser.fromPixels(imageData).toFloat().div(255.0);

  // Resize the image to match the model's input size
  const resizedImage = tf.image.resizeBilinear(imageTensor, [299, 299]);

  // Expand dimensions to match the model's input shape
  const inputTensor = resizedImage.expandDims(0);

  // Make predictions using the model
  const predictions = model.predict(inputTensor);
  // console.log(predictions.dataSync());

  // Define a threshold for NSFW classification
  // const nsfwThreshold = 0.5;

  // Check if NSFW score is above the threshold
  const isNSFW =
    predictions.dataSync()[1] > 0.3 ||
    predictions.dataSync()[3] > 0.3 ||
    predictions.dataSync()[4] > 0.7;

  // Dispose of tensors to free up GPU memory
  inputTensor.dispose();
  predictions.dispose();

  // Apply blur if it's NSFW (you can modify this part for videos)
  if (isNSFW) {
      // mediaElement.style.filter = "blur(20px)";
      mediaElement.parentNode.parentNode.style.filter = "blur(20px)";
      await nsfw();
    }

  // Mark the media element as checked
  mediaElement.classList.add("checked");
}
async function processVideo(mediaElement) {
  if (!model) {
    console.error("Model not loaded");
    return false;
  }
  const canvas = document.createElement("canvas");
  canvas.width = mediaElement.width || mediaElement.videoWidth || 0;
  canvas.height = mediaElement.height || mediaElement.videoHeight || 0;
  const context = canvas.getContext("2d");
  context.drawImage(mediaElement, 0, 0, canvas.width, canvas.height);
  // console.log(canvas.width, canvas.height);

  // Extract the image data from the canvas
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  // console.log(imageData);

  // Convert the image data to a tensor
  const imageTensor = tf.browser.fromPixels(imageData).toFloat().div(255.0);

  // Resize the image to match the model's input size
  const resizedImage = tf.image.resizeBilinear(imageTensor, [299, 299]);

  // Expand dimensions to match the model's input shape
  const inputTensor = resizedImage.expandDims(0);

  // Make predictions using the model
  const predictions = model.predict(inputTensor);
  // console.log(predictions.dataSync());

  // Define a threshold for NSFW classification
  // const nsfwThreshold = 0.5;

  // Check if NSFW score is above the threshold
  const isNSFW =
    predictions.dataSync()[1] > 0.3 ||
    predictions.dataSync()[3] > 0.3 ||
    predictions.dataSync()[4] > 0.7;

  // Dispose of tensors to free up GPU memory
  inputTensor.dispose();
  predictions.dispose();

  // Apply blur if it's NSFW (you can modify this part for videos)
  if (isNSFW) {
      // console.log("video : "+mediaElement.src+" is NSFW");
      mediaElement.parentNode.parentNode.style.filter = "blur(20px)";
      mediaElement.LoadedBehavior = "Manual"
      mediaElement.pause();
      mediaElement.muted = true;
      await nsfw();
      mediaElement.classList.add("checked");
  }

  // Mark the media element as checked
}

// Function to apply NSFW detection and blurring to all media elements on the page
async function blurImagesMediaElements() {
  const mediaElements = document.querySelectorAll("img");
  // console.log(mediaElements.length);
  for (const mediaElement of mediaElements) {
    if (
      (!mediaElement.classList.contains("checked")) &&
      mediaElement.clientWidth > 40 &&
      mediaElement.clientHeight > 40
    ) {
      try {
        processImage(mediaElement);
      } catch (err) {
        console.log(err);
      }
    }

  }
}

async function blurVideosMediaElements() {
  const videoElements = document.querySelectorAll("video");
  // console.log(videoElements.length);
  for (const mediaElement of videoElements) {
    if ((!mediaElement.classList.contains("checked"))&&(mediaElement.clientWidth > 40 &&
      mediaElement.clientHeight > 40
    )) {
      try {
        if(!hashset.has(mediaElement.src)||mediaElement.crossOrigin!="anonymous") {
          const attributes = [...mediaElement.attributes];
          let index = -1;
          for(let i=0;i<attributes.length;i++) {
            mediaElement.removeAttribute(attributes[i].name);
            if(attributes[i].name=="crossorigin") {
              index = i;
            }
          }
          mediaElement.setAttribute("crossOrigin", "anonymous");
          for(let i=0;i<attributes.length;i++) {
            if(i!=index) {
            mediaElement.setAttribute(attributes[i].name, attributes[i].value);
            }
          }
          hashset.add(mediaElement.src);
         }
          else if(mediaElement.readyState>=2) {
           processVideo(mediaElement);
        }
      } catch (err) {
        console.log(err);
      }
    }
  }
}

async function blurMediaInIframes() {
  const iframes = document.querySelectorAll("iframe");

  for (const iframe of iframes) {
    iframe.style.filter = "blur(20px)";
  }
}
async function blurAllMediaElements() {
  const mediaElements = document.querySelectorAll("img");
  if(noOfImages!=mediaElements.length) {
    noOfImages = mediaElements.length;
    await blurImagesMediaElements();
  }
  await blurVideosMediaElements();
}

// Run blurAllMediaElements() when the page is fully loaded
window.addEventListener("load", async () => {
  await loadModel();
  // console.log("Model loaded");
  await blurAllMediaElements();
  setInterval(blurAllMediaElements, 5000); // Check every 10 seconds
});