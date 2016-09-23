var App = function() {
  function init() {
    typeEngine();
  }
  
  //Privates
  function typeEngine() {
    var err;
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
        if($(this).parent().hasClass('dm')) {
          return;
        }
        lastIdxPosSuccess = (lastIdxPosSuccess + currentIdx + 1);
        $(this).val('');
      }
      
      if(currentChar == splitPara[(currentIdx + lastIdxPosSuccess)]) {
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