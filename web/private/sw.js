self.addEventListener('push', event => {
  let data = {"title": "default data"};
  console.log("webPushnotif serice worker");
  if (event.data) {
    data = event.data.json();
  }

//d
   self.registration.showNotification(data.title, {
     body: 'Yay it works!!!!!!!',
     vibrate: [300,200,400],
     icon: 'https://cdn.discordapp.com/attachments/643847353756942347/700767584684998736/Logo-ECLAIR_1.ai',
     image: 'https://i.ytimg.com/vi/HgCXdNhVC1Q/default.jpg'
   });
 });
/*
var socket = io.connect('https://192.168.1.203:433');

//var pseudo = prompt('Quel est votre pseudo ?');
socket.emit('petit_nouveau', "pseudo");

socket.on('message', function(obj) {
    console.log('Le serveur a un message pour vous : ' + obj.message);
    addmessage(obj.pseudo, obj.message);
});
socket.on('autre', function(message) {
    console.log('Le serveur a un message pour vous : ' + message);
});

socket.on('nouveau', function(pseudo) {
    console.log(pseudo + ' a rejoint ');
    addmessage(pseudo, "a rejoint le chat.")
});*/
/*  var button = getElementById('#poke');

button.click(function () {
    socket.emit('message', 'Salut serveur, ça va ?');
});*/
/*
function addmessage(pseudo, message) {
  var node = document.createElement("LI");                 // Create a <li> node
  var textnode = document.createTextNode(pseudo + ': ' + message);         // Create a text node
  node.appendChild(textnode);                              // Append the text to <li>
  document.getElementById("myList").appendChild(node);     // Append <li> to <ul> with id="myList"
};
*/
