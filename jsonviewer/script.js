var editor;

var setValue = (jsonString) => {
  // сюда тоже строку складываем но можно и на json переписатьы
  var json = JSON.parse(jsonString);
  editor.setValue(JSON.stringify(json, null, 2));
};

var onSave = () => {
  var value = editor.getValue(); // это строка
  return value;
};

var jsonTreeViewer = (function () {
  editor = ace.edit("editor");
  editor.session.setMode("ace/mode/json");
})();
