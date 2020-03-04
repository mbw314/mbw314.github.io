const images = [
  '01.png'
];

function showRandomImage(folder) {
  // Pick a random image and write the HTML image tag
  let index = Math.floor(Math.random() * images.length);
  let path = `./images/${folder}/${images[index]}`;
  let tag = `<img src="${path}" alt="michael b williams" />`;
}
