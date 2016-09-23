var App = function() {
  function init() {
    typeEngine();
    Typer.init();
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
    
    var errCounter = 0;
    
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
        
        console.log(errCounter);
        console.log($(this).val().length);
        console.log($(this).val());
        var data = {
          errors: errCounter,
          length: $(this).val().length
        }
        
        Typer.sendKey(data);
        lastIdxPosSuccess = (lastIdxPosSuccess + currentIdx + 1);
        errCounter = 0; //reset errors
        $(this).val('');
      }
      
      if(currentChar == splitPara[(currentIdx + lastIdxPosSuccess)]) {
        userInputElmWrapper.removeClass('dm').addClass('m');
      } else {
        errCounter++;
        userInputElmWrapper.removeClass('m').addClass('dm');
      }
    });
  }
  
  return {
    init: init
  }
}();

App.init();