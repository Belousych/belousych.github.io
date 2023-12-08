// Тестовые данные

var usersData = [
  {
    uid: "6a09f20a-8de6-11e1-b3e1-001617ec3f2a", // уид пользователя
    name: "Петрович А.Х.",
    messages: [
      {
        date: "1987-05-15T00:00:00", // дата отправки
        message: "Петрович, ты ахуел?",
        sender: "1c", //это сообщение оператора из 1с
      },
      {
        date: "1987-05-12T00:00:00",
        message: "да",
        sender: "client", // это сообщение написал водитель
      },
    ],
  },
  {
    uid: "7a09f20a-8de6-11e1-b3e1-001617ec3f2a",
    name: "Сидоровч П.Н.",
    messages: [
      {
        date: "1987-07-14T00:00:00",
        message: "Петрович там ахуел, видел?",
        sender: "1c",
      },
      {
        date: "1987-08-14T00:00:00",
        message: "сам в ахуе",
        sender: "client",
      },
    ],
  },
];

var statuses = [
  {
    uid: "6a09f20a-8de6-11e1-b3e1-001617ec3f2a", // уид пользователя
    status: "online",
  },
  {
    uid: "7a09f20a-8de6-11e1-b3e1-001617ec3f2a",
    status: "offline",
  },
];

var messages = [
  {
    uid: "7a09f20a-8de6-11e1-b3e1-001617ec3f2a",
    message: "Передай Петровичу, что он он ахуел!",
    date: "1989-05-14T00:00:00",
    sender: "client",
  },
  {
    uid: "6a09f20a-8de6-11e1-b3e1-001617ec3f2a", // уид пользователя, который отправил сообщение
    message: "Чего там сидорович про меня говорит?",
    date: "1987-05-14T00:00:00", // дата отправки сообщения
    sender: "client",
  },
];

// ---------------------------------------------
// Глобальные переменные

var usersList = []; // список юзеров те что слева
var usersCollections = {}; // объект с юзерами где ключ uid

var newMessages = []; // список новых сообщений в чате оператора

var currentChat = {
  uid: null,
  get getUid() {
    return this.uid;
  },
  set setUid(value) {
    this.uid = value;

    reDrawChat();
  },
};

// ---------------------------------------------

// Функции

//  Рисуем список юзеров слева
function renderUsersList() {
  var slot = document.getElementById("users");

  var ul = document.createElement("ul");

  for (const [key, value] of Object.entries(usersCollections)) {
    const user = value;
    var li = document.createElement("li");

    li.textContent = user.name;
    li.dataset.uid = user.uid;

    if (user.uid === currentChat.getUid) {
      li.classList.add("active");
    }

    if (user?.status) {
      li.classList.add(user.status);
    }

    ul.append(li);
  }

  slot.innerHTML = " ";
  slot.appendChild(ul);
}

// Рисуем сообщения
function renderMessages() {
  var slot = document.getElementById("messagesSlot");
  var ul = document.createElement("ul");

  var messages = usersCollections[currentChat.getUid].messages || [];
  var messages = messages.sort(compareByDate);

  for (let index = 0; index < messages.length; index++) {
    const item = messages[index];
    var li = document.createElement("li");
    li.textContent = item.message;
    if (item?.sender) {
      li.classList.add(`sender_${item.sender}`);
    }

    ul.append(li);
  }

  slot.innerHTML = " ";
  slot.appendChild(ul);
}

//  Рисуем чат
async function reDrawChat() {
  await renderUsersList();
  await renderMessages();
}

// Устанавливаем юзеров первая функция
function SetUsers(users) {
  usersList = users;
  currentChat.setUid = usersData[0].uid;

  for (let index = 0; index < users.length; index++) {
    const user = users[index];
    usersCollections[user.uid] = user;
  }

  reDrawChat(); // рисуем чат
}

function setOnlineUsers(usersData) {
  for (let index = 0; index < usersData.length; index++) {
    const user = usersData[index];
    usersCollections[user.uid].status = user.status;
  }

  renderUsersList();
}

function handleClickDocument(event) {
  if (event.target.dataset.uid) {
    currentChat.setUid = event.target.dataset.uid; // выбираем юзера по клику
  }
}

// сортировка по дате
function compareByDate(a, b) {
  return new Date(a.date) - new Date(b.date);
}

// Оператор написал новое сообщение
function sendNewMessage(message) {
  usersCollections[message.uid].messages.push(message);
  newMessages.push(message);
}

function returnNewMessages() {
  return newMessages;
}

function clearNewMessages() {
  newMessages = [];
}

// из 1с пришли новые сообщения от водителей положим их в общую коллекцию
function acceptNewMessages(messages) {
  if (!messages || messages.length === 0) {
    return;
  }
  for (let index = 0; index < messages.length; index++) {
    const message = messages[index];
    usersCollections[message.uid].messages.push(message);
  }

  renderMessages();
}

// Оператор ввел сообщение и нажал отправить или Enter
function handleSubmit(event) {
  event.preventDefault();
  event.stopPropagation();

  var formElem = event.target;
  var formData = new FormData(formElem);
  var text = formData.get("formInput");

  if (!text) {
    return;
  }

  sendNewMessage({
    uid: currentChat.getUid,
    message: text,
    date: new Date(),
    sender: "1c",
  });

  formElem.reset();

  renderMessages();
}

function start() {
  document.addEventListener("click", handleClickDocument);
  var form = document.getElementById("form");
  form.addEventListener("submit", handleSubmit);

  SetUsers(usersData);

  setOnlineUsers(statuses); // устанавливаем статус

  acceptNewMessages(messages);
}

(function () {
  start();
})();
