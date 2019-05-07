// Set up the image files to be used.
var imageArray = new Array()

imageArray[0] = '/01.jpg'
imageArray[1] = '/04.jpg'
imageArray[2] = '/05.jpg'
imageArray[3] = '/06.jpg'
imageArray[4] = '/09.jpg'
imageArray[5] = '/13.jpg'
imageArray[6] = '/14.jpg'
imageArray[7] = '/15.jpg'
imageArray[8] = '/16.jpg'
imageArray[9] = '/17.jpg'
imageArray[10] = '/20.jpg'
imageArray[11] = '/21.jpg'
imageArray[12] = '/22.jpg'
imageArray[13] = '/23.jpg'
imageArray[14] = '/24.jpg'
imageArray[15] = '/25.jpg'
imageArray[16] = '/26.jpg'
imageArray[17] = '/27.jpg'
imageArray[18] = '/28.jpg'
imageArray[19] = '/29.jpg'
imageArray[20] = '/30.jpg'
imageArray[21] = '/31.jpg'
imageArray[22] = '/32.jpg'
imageArray[23] = '/33.jpg'



// Pick a random image and write the HTML code
var imageIndex = Math.round(Math.random()*(imageArray.length-1));
function showImage(path){
   var imagePath = "./images/" + path + imageArray[imageIndex];	
   //alert(thePath);
   document.write('<img src="'+imagePath+'" alt="michael b williams" />');
}
