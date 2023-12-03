// Тестовые данные

var usersData = [
  {
    uid: "6a09f20a-8de6-11e1-b3e1-001617ec3f2a", // уид пользователя
    name: "Петрович А.Х.",
    messages: [
      {
        date: "1987-05-14T00:00:00", // дата отправки
        message: "Петрович, ты ахуел?",
        sender: "1c", //это сообщение оператора из 1с
      },
      {
        date: "1987-05-14T00:00:00",
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
        date: "1987-05-14T00:00:00",
        message: "Петрович там ахуел, видел?",
        sender: "1c",
      },
      {
        date: "1987-05-14T00:00:00",
        message: "сам в ахуе",
        sender: "client",
      },
    ],
  },
];

// ---------------------------------------------
// Глобальные переменные

var usersList = []; // список юзеров те что слева


var currentChat = {
  uid: null,
  get getUid() {
    return this.uid;
  },
  set setUid(value) {
    this.uid = value;
    
  },
};

// ---------------------------------------------

// Функции

function renderUsersList() {
  var slot = document.getElementById("users");

  var ul = document.createElement("ul");
  for (let index = 0; index < usersList.length; index++) {
    const user = usersList[index];
    var li = document.createElement("li");

    li.textContent = user.name;
    li.dataset.uid = user.uid;

    if (user.uid === currentChat.getUid) {
      li.classList.add("active");
    }

    ul.append(li);
  }

  slot.innerHTML = " ";
  slot.appendChild(ul);
}

function SetUsers(users) {
  usersList = users;
  currentChat.setUid = usersData[0].uid;
  renderUsersList();
}

function handleClickDocument(event) {
  if (event.target.dataset.uid) {
    currentChat.setUid = event.target.dataset.uid;
    
  }
}

function start() {
  document.addEventListener("click", handleClickDocument);

  SetUsers(usersData);
  
}

(function () {
  start();
})();

// SetUsers(array){…} – Это стартовая функция. Сюда будем отправлять список юзеров, а так же последние 15 сообщений с ними. При необходимости мы буде
// [
//   {
//      "uid": "6a09f20a-8de6-11e1-b3e1-001617ec3f2a", // уид пользователя
//      "name": "Петрович А.Х.",
//      "messages": [
//         {
//            "date": "1987-05-14T00:00:00", // дата отправки
//            "message": "Петрович, ты ахуел?",
//            "sender": "1c" //это сообщение оператора из 1с
//         },
//         {
//            "date": "1987-05-14T00:00:00",
//            "message": "да",
//            "sender": "client" // это сообщение написал водитель
//         }
//      ]
//   },
//   {
//      "uid": "7a09f20a-8de6-11e1-b3e1-001617ec3f2a",
//      "name": "Сидоровч П.Н.",
//      "messages": [
//         {
//            "date": "1987-05-14T00:00:00",
//            "message": "Петрович там ахуел, видел?",
//            "sender": "1c"
//         },
//         {
//            "date": "1987-05-14T00:00:00",
//            "message": "сам в ахуе",
//            "sender": "client"
//         }
//      ]
//   }
// ]

// setOnlineUsers (array) {…} - Определение кто из пользователей онлайн. Серая точка у имени – не в сети, синяя точка в сети. На эту функцию мы отправляем статусы всех юзеров в списке, поэтому вначале функции мы очищаем статус, а потом назначаем.
// [
//   {
//      "uid": "6a09f20a-8de6-11e1-b3e1-001617ec3f2a", // уид пользователя
// "status": "online"
//   },
//   {
//      "uid": "7a09f20a-8de6-11e1-b3e1-001617ec3f2a",
//      "status": "offline"
//   }
// ]

// sendNewMessage(){…} – когда из чата отправляется сообщение, то оно должно помещаться в глобальную переменную  newMessages = [] и отображаться в чате
// [
//   {
//      "uid": "7a09f20a-8de6-11e1-b3e1-001617ec3f2a",
//      "message": "Передай Петровичу, что он он ахуел!",
//      "date": "1987-05-14T00:00:00"
//   },
// {
//      "uid": "6a09f20a-8de6-11e1-b3e1-001617ec3f2a", // уид пользователя, который отправил сообщение
//      "message": "Чего там сидорович про меня говорит?",
//      "date": "1987-05-14T00:00:00" // дата отправки сообщения
//   }
// ]

// returnNewMessages(){…} – возвращает содержимое глобальной переменной newMessages

// returnNewMessages(){…} – очищает newMessages
// acceptNewMessage(array){…} – мы из 1с сюда отправляем новые сообщения от водителей, они должны появляться в чате
// [
//   {
//      "uid": "7a09f20a-8de6-11e1-b3e1-001617ec3f2a",
//      "message": "Передай Петровичу, что он он ахуел!",
//      "date": "1987-05-14T00:00:00"
//   },
// {
//      "uid": "6a09f20a-8de6-11e1-b3e1-001617ec3f2a", // уид пользователя, который отправил сообщение
//      "message": "Чего там сидорович про меня говорит?",
//      "date": "1987-05-14T00:00:00" // дата отправки сообщения
//   }
// ]
