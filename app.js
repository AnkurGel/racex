var App = function() {
  function init() {
    typeEngine();
  }
  
  //Privates
  function typeEngine() {
    var lastIdxPosSuccess = 0; //special var to hold index after clearing input
    var userInputElmWrapper = $('#user-input');
    var userInputElm = userInputElmWrapper.find('input');
    
    //Para Splits
    var getPara = $('#sample-text').text().trim();
    var splitPara = getPara.split('');
    
    userInputElm.on('input', function () {
      var userInput = $(this).val();
      var explodeUserInput = userInput.split('');
      var currentIdx = explodeUserInput.length - 1;
      
      //User Input Split
      var currentChar = explodeUserInput[currentIdx];
      
      if(splitPara[(lastIdxPosSuccess + currentIdx)] == ' ') {
        lastIdxPosSuccess = (lastIdxPosSuccess + currentIdx);
        console.log(lastIdxPosSuccess);
        $(this).val('');
      }
      
      if(currentChar == splitPara[currentIdx]) {
        userInputElmWrapper.removeClass('dm').addClass('m');
      } else {
        userInputElmWrapper.removeClass('m').addClass('dm');
      }
    });
  }
  
  return {
    init: init
  }
}();

App.init();