(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

  /**
   * Applies the :focus-visible polyfill at the given scope.
   * A scope in this case is either the top-level Document or a Shadow Root.
   *
   * @param {(Document|ShadowRoot)} scope
   * @see https://github.com/WICG/focus-visible
   */
  function applyFocusVisiblePolyfill(scope) {
    var hadKeyboardEvent = true;
    var hadFocusVisibleRecently = false;
    var hadFocusVisibleRecentlyTimeout = null;

    var inputTypesAllowlist = {
      text: true,
      search: true,
      url: true,
      tel: true,
      email: true,
      password: true,
      number: true,
      date: true,
      month: true,
      week: true,
      time: true,
      datetime: true,
      'datetime-local': true
    };

    /**
     * Helper function for legacy browsers and iframes which sometimes focus
     * elements like document, body, and non-interactive SVG.
     * @param {Element} el
     */
    function isValidFocusTarget(el) {
      if (
        el &&
        el !== document &&
        el.nodeName !== 'HTML' &&
        el.nodeName !== 'BODY' &&
        'classList' in el &&
        'contains' in el.classList
      ) {
        return true;
      }
      return false;
    }

    /**
     * Computes whether the given element should automatically trigger the
     * `focus-visible` class being added, i.e. whether it should always match
     * `:focus-visible` when focused.
     * @param {Element} el
     * @return {boolean}
     */
    function focusTriggersKeyboardModality(el) {
      var type = el.type;
      var tagName = el.tagName;

      if (tagName === 'INPUT' && inputTypesAllowlist[type] && !el.readOnly) {
        return true;
      }

      if (tagName === 'TEXTAREA' && !el.readOnly) {
        return true;
      }

      if (el.isContentEditable) {
        return true;
      }

      return false;
    }

    /**
     * Add the `focus-visible` class to the given element if it was not added by
     * the author.
     * @param {Element} el
     */
    function addFocusVisibleClass(el) {
      if (el.classList.contains('focus-visible')) {
        return;
      }
      el.classList.add('focus-visible');
      el.setAttribute('data-focus-visible-added', '');
    }

    /**
     * Remove the `focus-visible` class from the given element if it was not
     * originally added by the author.
     * @param {Element} el
     */
    function removeFocusVisibleClass(el) {
      if (!el.hasAttribute('data-focus-visible-added')) {
        return;
      }
      el.classList.remove('focus-visible');
      el.removeAttribute('data-focus-visible-added');
    }

    /**
     * If the most recent user interaction was via the keyboard;
     * and the key press did not include a meta, alt/option, or control key;
     * then the modality is keyboard. Otherwise, the modality is not keyboard.
     * Apply `focus-visible` to any current active element and keep track
     * of our keyboard modality state with `hadKeyboardEvent`.
     * @param {KeyboardEvent} e
     */
    function onKeyDown(e) {
      if (e.metaKey || e.altKey || e.ctrlKey) {
        return;
      }

      if (isValidFocusTarget(scope.activeElement)) {
        addFocusVisibleClass(scope.activeElement);
      }

      hadKeyboardEvent = true;
    }

    /**
     * If at any point a user clicks with a pointing device, ensure that we change
     * the modality away from keyboard.
     * This avoids the situation where a user presses a key on an already focused
     * element, and then clicks on a different element, focusing it with a
     * pointing device, while we still think we're in keyboard modality.
     * @param {Event} e
     */
    function onPointerDown(e) {
      hadKeyboardEvent = false;
    }

    /**
     * On `focus`, add the `focus-visible` class to the target if:
     * - the target received focus as a result of keyboard navigation, or
     * - the event target is an element that will likely require interaction
     *   via the keyboard (e.g. a text box)
     * @param {Event} e
     */
    function onFocus(e) {
      // Prevent IE from focusing the document or HTML element.
      if (!isValidFocusTarget(e.target)) {
        return;
      }

      if (hadKeyboardEvent || focusTriggersKeyboardModality(e.target)) {
        addFocusVisibleClass(e.target);
      }
    }

    /**
     * On `blur`, remove the `focus-visible` class from the target.
     * @param {Event} e
     */
    function onBlur(e) {
      if (!isValidFocusTarget(e.target)) {
        return;
      }

      if (
        e.target.classList.contains('focus-visible') ||
        e.target.hasAttribute('data-focus-visible-added')
      ) {
        // To detect a tab/window switch, we look for a blur event followed
        // rapidly by a visibility change.
        // If we don't see a visibility change within 100ms, it's probably a
        // regular focus change.
        hadFocusVisibleRecently = true;
        window.clearTimeout(hadFocusVisibleRecentlyTimeout);
        hadFocusVisibleRecentlyTimeout = window.setTimeout(function() {
          hadFocusVisibleRecently = false;
        }, 100);
        removeFocusVisibleClass(e.target);
      }
    }

    /**
     * If the user changes tabs, keep track of whether or not the previously
     * focused element had .focus-visible.
     * @param {Event} e
     */
    function onVisibilityChange(e) {
      if (document.visibilityState === 'hidden') {
        // If the tab becomes active again, the browser will handle calling focus
        // on the element (Safari actually calls it twice).
        // If this tab change caused a blur on an element with focus-visible,
        // re-apply the class when the user switches back to the tab.
        if (hadFocusVisibleRecently) {
          hadKeyboardEvent = true;
        }
        addInitialPointerMoveListeners();
      }
    }

    /**
     * Add a group of listeners to detect usage of any pointing devices.
     * These listeners will be added when the polyfill first loads, and anytime
     * the window is blurred, so that they are active when the window regains
     * focus.
     */
    function addInitialPointerMoveListeners() {
      document.addEventListener('mousemove', onInitialPointerMove);
      document.addEventListener('mousedown', onInitialPointerMove);
      document.addEventListener('mouseup', onInitialPointerMove);
      document.addEventListener('pointermove', onInitialPointerMove);
      document.addEventListener('pointerdown', onInitialPointerMove);
      document.addEventListener('pointerup', onInitialPointerMove);
      document.addEventListener('touchmove', onInitialPointerMove);
      document.addEventListener('touchstart', onInitialPointerMove);
      document.addEventListener('touchend', onInitialPointerMove);
    }

    function removeInitialPointerMoveListeners() {
      document.removeEventListener('mousemove', onInitialPointerMove);
      document.removeEventListener('mousedown', onInitialPointerMove);
      document.removeEventListener('mouseup', onInitialPointerMove);
      document.removeEventListener('pointermove', onInitialPointerMove);
      document.removeEventListener('pointerdown', onInitialPointerMove);
      document.removeEventListener('pointerup', onInitialPointerMove);
      document.removeEventListener('touchmove', onInitialPointerMove);
      document.removeEventListener('touchstart', onInitialPointerMove);
      document.removeEventListener('touchend', onInitialPointerMove);
    }

    /**
     * When the polfyill first loads, assume the user is in keyboard modality.
     * If any event is received from a pointing device (e.g. mouse, pointer,
     * touch), turn off keyboard modality.
     * This accounts for situations where focus enters the page from the URL bar.
     * @param {Event} e
     */
    function onInitialPointerMove(e) {
      // Work around a Safari quirk that fires a mousemove on <html> whenever the
      // window blurs, even if you're tabbing out of the page. ¯\_(ツ)_/¯
      if (e.target.nodeName && e.target.nodeName.toLowerCase() === 'html') {
        return;
      }

      hadKeyboardEvent = false;
      removeInitialPointerMoveListeners();
    }

    // For some kinds of state, we are interested in changes at the global scope
    // only. For example, global pointer input, global key presses and global
    // visibility change should affect the state at every scope:
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('touchstart', onPointerDown, true);
    document.addEventListener('visibilitychange', onVisibilityChange, true);

    addInitialPointerMoveListeners();

    // For focus and blur, we specifically care about state changes in the local
    // scope. This is because focus / blur events that originate from within a
    // shadow root are not re-dispatched from the host element if it was already
    // the active element in its own scope:
    scope.addEventListener('focus', onFocus, true);
    scope.addEventListener('blur', onBlur, true);

    // We detect that a node is a ShadowRoot by ensuring that it is a
    // DocumentFragment and also has a host property. This check covers native
    // implementation and polyfill implementation transparently. If we only cared
    // about the native implementation, we could just check if the scope was
    // an instance of a ShadowRoot.
    if (scope.nodeType === Node.DOCUMENT_FRAGMENT_NODE && scope.host) {
      // Since a ShadowRoot is a special kind of DocumentFragment, it does not
      // have a root element to add a class to. So, we add this attribute to the
      // host element instead:
      scope.host.setAttribute('data-js-focus-visible', '');
    } else if (scope.nodeType === Node.DOCUMENT_NODE) {
      document.documentElement.classList.add('js-focus-visible');
      document.documentElement.setAttribute('data-js-focus-visible', '');
    }
  }

  // It is important to wrap all references to global window and document in
  // these checks to support server-side rendering use cases
  // @see https://github.com/WICG/focus-visible/issues/199
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    // Make the polyfill helper globally available. This can be used as a signal
    // to interested libraries that wish to coordinate with the polyfill for e.g.,
    // applying the polyfill to a shadow root:
    window.applyFocusVisiblePolyfill = applyFocusVisiblePolyfill;

    // Notify interested libraries of the polyfill's presence, in case the
    // polyfill was loaded lazily:
    var event;

    try {
      event = new CustomEvent('focus-visible-polyfill-ready');
    } catch (error) {
      // IE11 does not support using CustomEvent as a constructor directly:
      event = document.createEvent('CustomEvent');
      event.initCustomEvent('focus-visible-polyfill-ready', false, false, {});
    }

    window.dispatchEvent(event);
  }

  if (typeof document !== 'undefined') {
    // Apply the polyfill to the global document, so that no JavaScript
    // coordination is required to use the polyfill in the top-level document:
    applyFocusVisiblePolyfill(document);
  }

})));

},{}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Created by User on 010 10.06.21.
 */
var _default = function _default(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
};

exports.default = _default;

},{}],3:[function(require,module,exports){
"use strict";

require("focus-visible");

var _ajaxQuery = _interopRequireDefault(require("./modules/ajaxQuery"));

var _popupForm = _interopRequireDefault(require("./modules/popupForm"));

var _documentReady = _interopRequireDefault(require("./helpers/documentReady"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Created by User on 022 22.05.21.
 */
(0, _documentReady.default)(function () {
  (0, _ajaxQuery.default)();
  (0, _popupForm.default)();
});

},{"./helpers/documentReady":2,"./modules/ajaxQuery":4,"./modules/popupForm":5,"focus-visible":1}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Created by User on 019 19.08.21.
 */
var _default = function _default() {
  var bodyScrollingToggle = function bodyScrollingToggle() {
    document.body.classList.toggle("stop-scrolling");
  };

  function ajax(url, method, functionName, dataArray) {
    var xhttp = new XMLHttpRequest();
    xhttp.open(method, url, true);
    xhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhttp.send(requestData(dataArray));

    xhttp.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        functionName(this);
      }
    };
  }

  function requestData(dataArr) {
    var out = "";

    for (var key in dataArr) {
      out += "".concat(key, "=").concat(dataArr[key], "&");
    }

    return out;
  } //--------------------------------------------------------------//


  var btnPost = document.querySelector('.btnPost'),
      commentPost = document.querySelector('.addCommentBtn'),
      addComment = document.querySelectorAll('.addComment'),
      title = document.querySelector('.title'),
      author = document.querySelector('.author'),
      shortDescription = document.querySelector('.short_description'),
      message = document.querySelector('.full_description'),
      commentator = document.querySelector('.firstName'),
      comment = document.querySelector('.comment'),
      mainSection = document.querySelector('.message_list'),
      idField = document.querySelector('.idField'),
      popupWindow = document.querySelector('.popup-form'),
      popupCommentWindow = document.querySelector('.popup-comment-form'),
      popupEditWindow = document.querySelector('.popup-edit-form'),
      messageform = document.querySelector('form'),
      commentform = document.querySelector('.popup-comment-form form');
  var commentsBlock;
  var messagesArray = [];
  var idUpdateField; //--------------------------------------------------------------//

  btnPost.addEventListener('click', function (e) {
    e.preventDefault();

    if (title.value == '') {
      title.placeholder = 'Title should not be empty!';
      title.classList.add('colorPlaceholder');
    }

    if (author.value == '') {
      author.placeholder = 'Author should not be empty!';
      author.classList.add('colorPlaceholder');
    }

    if (shortDescription.value == '') {
      shortDescription.placeholder = 'Short Description should not be empty!';
      shortDescription.classList.add('colorPlaceholder');
    }

    if (message.value == '') {
      message.placeholder = 'Message field should not be empty!';
      message.classList.add('colorPlaceholder');
    } else if (title.value != '' && author.value != '' && shortDescription.value != '' && message.value != '') {
      var dataArr = {
        "postMessage": btnPost,
        "title": "".concat(title.value),
        "author": "".concat(author.value),
        "shortDescription": "".concat(shortDescription.value),
        "message": "".concat(message.value)
      };
      ajax('fetch.php', 'post', showMessages, dataArr);
      form.reset();
    }
  }); //--------------------------------------------------------------//

  addComment.forEach(function (item) {
    item.addEventListener("click", function (e) {
      idField.value = e.target.id;
    });
  }); //--------------------------------------------------------------//

  commentPost.addEventListener('click', function (e) {
    e.preventDefault();

    if (commentator.value == '') {
      commentator.placeholder = 'Commentator should not be empty!';
      commentator.classList.add('colorPlaceholder');
    }

    if (comment.value == '') {
      comment.placeholder = 'Comment should not be empty!';
      comment.classList.add('colorPlaceholder');
    } else if (commentator.value != '' && comment.value != '') {
      var dataArr = {
        "postCommentBtn": commentPost,
        "commentator": "".concat(commentator.value),
        "comment": "".concat(comment.value),
        "messageID": "".concat(idField.value)
      };
      ajax('fetchComment.php', 'post', insertComments, dataArr);
      commentform.reset();
    }
  }); //--------------------------------------------------------------//

  window.addEventListener('load', function (e) {
    e.preventDefault();
    var dataArrLoad = {
      "windowLoaded": true
    };
    ajax('fetch.php', 'post', showDataOnLoad, dataArrLoad);
  }); //--------------------------------------------------------------//

  function showMessages(dataAtrr) {
    popupWindow.classList.remove("open");
    location.reload();
  } //---------------------showDataOnLoad-----------------------------------------//


  function showDataOnLoad(dataAtrr) {
    //---------------Getting Data From Table Messages-----------------//
    var arr = JSON.parse(dataAtrr.response); //---------------Creating Message Div-----------------//

    arr.forEach(function (item) {
      var messageBlock = document.createElement("div");
      messageBlock.classList.add("message-block");
      messageBlock.innerHTML = '<div class="message-title"><b>Title: </b><br><br>' + item.title + '</div>\
                <div class="message__short-description"><br><b>Short description: </b><br><p>' + item.description + '</p></div>\
                <button class="addComment" id ="' + item.id + '">Post a comment</button> \
                <button class="viewHideComments" id ="' + item.id + '">View  comments</button> \
                <button class="editMessage" id ="' + item.id + '">Edit message</button> \
                <div class="commentsBlock hide">Hi there!</div>\
                <hr>';
      var commentsBlock = messageBlock.querySelector('.commentsBlock');
      commentsBlock.innerHTML = '';
      messagesArray.push(messageBlock);
    });
    displayList(messagesArray, messagesList, rows, currentPage);
    setupPagination(messagesArray, pageNumbers, rows); //---------------Clicking on a "Post a Comment" button-----------------//

    var addCommentBtn = document.querySelectorAll(".addComment"),
        viewHideCommentsBtn = document.querySelectorAll(".viewHideComments"),
        idField = popupCommentWindow.querySelector(".idField"),
        closeCommentWindowBtn = popupCommentWindow.querySelector(".close-form-menu"),
        closeEditWindowBtn = popupEditWindow.querySelector(".close-form-menu");
    document.addEventListener('click', function (e) {
      e.preventDefault();

      if (e.target.classList.contains('addComment')) {
        popupCommentWindow.classList.add("open");
        document.querySelector(".fade-out-effect").classList.add("active");
        idField.value = e.target.getAttribute("id");
        bodyScrollingToggle();
      } //---------------Clicking on a "View Comments" button-----------------//


      if (e.target.classList.contains('viewHideComments')) {
        var dataArr = {
          "viewCommentBtn": e.target,
          "itemID": "".concat(e.target.getAttribute('id')),
          "commentPosted": true
        };
        commentsBlock = e.target.closest(".message-block").querySelector(".commentsBlock");
        ajax('fetchComment.php', 'post', showComments, dataArr);

        if (e.target.parentNode.querySelector(".commentsBlock").classList.contains("hide")) {
          e.target.parentNode.querySelector(".commentsBlock").classList.toggle("hide");
          e.target.innerHTML = "Hide comments";
        } else {
          e.target.parentNode.querySelector(".commentsBlock").classList.toggle("hide");
          e.target.innerHTML = "View comments";
        }
      } //---------------Clicking on a "Edit message" button-----------------//


      if (e.target.classList.contains('editMessage')) {
        idUpdateField = popupEditWindow.querySelector('.idField');
        var _dataArr = {
          "editMessageBtn": e.target,
          "messageEditID": "".concat(e.target.getAttribute('id')),
          "editMessage": true
        };
        popupEditWindow.classList.add("open");
        document.querySelector(".fade-out-effect").classList.add("active");
        idUpdateField.value = e.target.getAttribute("id");
        bodyScrollingToggle();
        ajax('editMessage.php', 'post', editMessage, _dataArr);
      }

      if (e.target.classList.contains('btnEdit')) {
        var titleUpdate = popupEditWindow.querySelector(".title");
        var titleUpdateValue = popupEditWindow.querySelector(".title").value;
        var authorUpdate = popupEditWindow.querySelector(".author");
        var authorUpdateValue = popupEditWindow.querySelector(".author").value;
        var descriptionUpdate = popupEditWindow.querySelector(".short_description");
        var descriptionUpdateValue = popupEditWindow.querySelector(".short_description").value;
        var messageUpdate = popupEditWindow.querySelector(".full_description");
        var messageUpdateValue = popupEditWindow.querySelector(".full_description").value;

        if (titleUpdateValue == '') {
          titleUpdate.placeholder = 'Title should not be empty!';
          titleUpdate.classList.add('colorPlaceholder');
        }

        if (authorUpdateValue == '') {
          authorUpdate.placeholder = 'Author should not be empty!';
          authorUpdate.classList.add('colorPlaceholder');
        }

        if (descriptionUpdateValue == '') {
          descriptionUpdate.placeholder = 'Short Description should not be empty!';
          descriptionUpdate.classList.add('colorPlaceholder');
        }

        if (messageUpdateValue == '') {
          messageUpdate.placeholder = 'Message field should not be empty!';
          messageUpdate.classList.add('colorPlaceholder');
        } else if (titleUpdateValue != '' && authorUpdateValue != '' && descriptionUpdateValue != '' && messageUpdateValue != '') {
          var _dataArr2 = {
            "updateInfoBtn": e.target,
            "messageUpdateID": "".concat(idUpdateField.value),
            "updateInfo": true,
            "titleUpdate": titleUpdateValue,
            "authorUpdate": authorUpdateValue,
            "descriptionUpdate": descriptionUpdateValue,
            "messageUpdate": messageUpdateValue
          };
          bodyScrollingToggle();
          ajax('editMessage.php', 'post', updateMessage, _dataArr2);
        }
      }
    });
    closeCommentWindowBtn.addEventListener("click", function () {
      popupCommentWindow.classList.remove("open");
      bodyScrollingToggle();
    });
    closeEditWindowBtn.addEventListener("click", function () {
      popupEditWindow.classList.remove("open");
      bodyScrollingToggle();
    });
  }

  ; //----------------------------insertComments----------------------------------//

  function insertComments(dataAtrr) {
    popupCommentWindow.classList.remove("open");
    location.reload();
  } //-----------------------showComments---------------------------------------//


  function showComments(dataAtrr) {
    var response = JSON.parse(dataAtrr.response);
    commentsBlock.innerHTML = "";

    if (response.length > 0) {
      response.forEach(function (key, value) {
        var row = document.createElement('div');
        row.classList.add('postedComment');
        row.innerHTML = '"' + key.commentText + '"' + " posted by " + key.commentator;
        commentsBlock.append(row);
      });
    } else {
      var row = document.createElement('div');
      row.innerHTML = "No comments yet";
      commentsBlock.append(row);
    }
  } //-----------------------editMessage---------------------------------------//


  function editMessage(dataAtrr) {
    var response = JSON.parse(dataAtrr.response);
    popupEditWindow.querySelector(".title").value = response[0].title;
    popupEditWindow.querySelector(".author").value = response[0].author;
    popupEditWindow.querySelector(".short_description").value = response[0].description;
    popupEditWindow.querySelector(".full_description").value = response[0].message;
  }

  function updateMessage(dataAtrr) {
    var response = dataAtrr.response;
    popupEditWindow.classList.remove('open');
    location.reload();
  } //-----------------------------Pagination---------------------------------//


  var messagesList = mainSection;
  var pageNumbers = document.querySelector("#pagination");
  var currentPage = 1,
      rows = 2;

  var displayList = function displayList(items, wrapper, rowsPerPage, page) {
    wrapper.innerHTML = "";
    page--;
    var start = rowsPerPage * page;
    var end = start + rowsPerPage;
    var paginatedItems = items.slice(start, end);

    for (var i = 0; i < paginatedItems.length; i++) {
      var item = paginatedItems[i];
      var itemElement = document.createElement('div');
      itemElement.classList.add('item');
      itemElement.append(item);
      mainSection.appendChild(itemElement);
    }
  };

  var setupPagination = function setupPagination(items, wrapper, rowsPerPage) {
    wrapper.innerHTML = "";
    var pageCount = Math.ceil(items.length / rowsPerPage);

    for (var i = 1; i < pageCount + 1; i++) {
      var btn = paginationButton(i, items);
      wrapper.appendChild(btn);
    }
  };

  var paginationButton = function paginationButton(page, items) {
    var button = document.createElement('button');
    button.innerText = page;
    if (currentPage == page) button.classList.add('active');
    button.addEventListener('click', function () {
      currentPage = page;
      displayList(items, messagesList, rows, currentPage);
      var currentBtn = document.querySelector('.pagenumbers button.active');
      currentBtn.classList.remove('active');
      button.classList.add('active');
    });
    return button;
  };
};

exports.default = _default;

},{}],5:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/**
 * Created by User on 024 24.10.21.
 */
var _default = function _default() {
  var bodyScrollingToggle = function bodyScrollingToggle() {
    document.body.classList.toggle("stop-scrolling");
  };

  (function () {
    var messagePost = document.querySelector(".messagePost"),
        messageWindow = document.querySelector(".popup-form"),
        closeMessageWindowBtn = messageWindow.querySelector(".close-form-menu");

    var fadeOutEffect = function fadeOutEffect() {
      setTimeout(function () {
        document.querySelector(".fade-out-effect").classList.remove("active");
      }, 300);
      "";
    };

    messagePost.addEventListener("click", function () {
      messageWindow.classList.add("open");
      messageWindow.reset();
      document.querySelector(".fade-out-effect").classList.add("active");
      bodyScrollingToggle();
    });
    closeMessageWindowBtn.addEventListener("click", function () {
      messageWindow.classList.remove("open");
      bodyScrollingToggle();
    });
  })();
};

exports.default = _default;

},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZm9jdXMtdmlzaWJsZS9kaXN0L2ZvY3VzLXZpc2libGUuanMiLCJzcmMvanMvaGVscGVycy9kb2N1bWVudFJlYWR5LmpzIiwic3JjL2pzL21haW4uanMiLCJzcmMvanMvbW9kdWxlcy9hamF4UXVlcnkuanMiLCJzcmMvanMvbW9kdWxlcy9wb3B1cEZvcm0uanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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LG1CQUFtQjtBQUN0QixLQUxEO0FBU0EsSUFBQSxxQkFBcUIsQ0FBQyxnQkFBdEIsQ0FBdUMsT0FBdkMsRUFBZ0QsWUFBTTtBQUNsRCxNQUFBLGFBQWEsQ0FBQyxTQUFkLENBQXdCLE1BQXhCLENBQStCLE1BQS9CO0FBQ0EsTUFBQSxtQkFBbUI7QUFDdEIsS0FIRDtBQU9ILEdBOUJEO0FBaUNILEMiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIoZnVuY3Rpb24gKGdsb2JhbCwgZmFjdG9yeSkge1xuICB0eXBlb2YgZXhwb3J0cyA9PT0gJ29iamVjdCcgJiYgdHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3J5KCkgOlxuICB0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQgPyBkZWZpbmUoZmFjdG9yeSkgOlxuICAoZmFjdG9yeSgpKTtcbn0odGhpcywgKGZ1bmN0aW9uICgpIHsgJ3VzZSBzdHJpY3QnO1xuXG4gIC8qKlxuICAgKiBBcHBsaWVzIHRoZSA6Zm9jdXMtdmlzaWJsZSBwb2x5ZmlsbCBhdCB0aGUgZ2l2ZW4gc2NvcGUuXG4gICAqIEEgc2NvcGUgaW4gdGhpcyBjYXNlIGlzIGVpdGhlciB0aGUgdG9wLWxldmVsIERvY3VtZW50IG9yIGEgU2hhZG93IFJvb3QuXG4gICAqXG4gICAqIEBwYXJhbSB7KERvY3VtZW50fFNoYWRvd1Jvb3QpfSBzY29wZVxuICAgKiBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9XSUNHL2ZvY3VzLXZpc2libGVcbiAgICovXG4gIGZ1bmN0aW9uIGFwcGx5Rm9jdXNWaXNpYmxlUG9seWZpbGwoc2NvcGUpIHtcbiAgICB2YXIgaGFkS2V5Ym9hcmRFdmVudCA9IHRydWU7XG4gICAgdmFyIGhhZEZvY3VzVmlzaWJsZVJlY2VudGx5ID0gZmFsc2U7XG4gICAgdmFyIGhhZEZvY3VzVmlzaWJsZVJlY2VudGx5VGltZW91dCA9IG51bGw7XG5cbiAgICB2YXIgaW5wdXRUeXBlc0FsbG93bGlzdCA9IHtcbiAgICAgIHRleHQ6IHRydWUsXG4gICAgICBzZWFyY2g6IHRydWUsXG4gICAgICB1cmw6IHRydWUsXG4gICAgICB0ZWw6IHRydWUsXG4gICAgICBlbWFpbDogdHJ1ZSxcbiAgICAgIHBhc3N3b3JkOiB0cnVlLFxuICAgICAgbnVtYmVyOiB0cnVlLFxuICAgICAgZGF0ZTogdHJ1ZSxcbiAgICAgIG1vbnRoOiB0cnVlLFxuICAgICAgd2VlazogdHJ1ZSxcbiAgICAgIHRpbWU6IHRydWUsXG4gICAgICBkYXRldGltZTogdHJ1ZSxcbiAgICAgICdkYXRldGltZS1sb2NhbCc6IHRydWVcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogSGVscGVyIGZ1bmN0aW9uIGZvciBsZWdhY3kgYnJvd3NlcnMgYW5kIGlmcmFtZXMgd2hpY2ggc29tZXRpbWVzIGZvY3VzXG4gICAgICogZWxlbWVudHMgbGlrZSBkb2N1bWVudCwgYm9keSwgYW5kIG5vbi1pbnRlcmFjdGl2ZSBTVkcuXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIGlzVmFsaWRGb2N1c1RhcmdldChlbCkge1xuICAgICAgaWYgKFxuICAgICAgICBlbCAmJlxuICAgICAgICBlbCAhPT0gZG9jdW1lbnQgJiZcbiAgICAgICAgZWwubm9kZU5hbWUgIT09ICdIVE1MJyAmJlxuICAgICAgICBlbC5ub2RlTmFtZSAhPT0gJ0JPRFknICYmXG4gICAgICAgICdjbGFzc0xpc3QnIGluIGVsICYmXG4gICAgICAgICdjb250YWlucycgaW4gZWwuY2xhc3NMaXN0XG4gICAgICApIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQ29tcHV0ZXMgd2hldGhlciB0aGUgZ2l2ZW4gZWxlbWVudCBzaG91bGQgYXV0b21hdGljYWxseSB0cmlnZ2VyIHRoZVxuICAgICAqIGBmb2N1cy12aXNpYmxlYCBjbGFzcyBiZWluZyBhZGRlZCwgaS5lLiB3aGV0aGVyIGl0IHNob3VsZCBhbHdheXMgbWF0Y2hcbiAgICAgKiBgOmZvY3VzLXZpc2libGVgIHdoZW4gZm9jdXNlZC5cbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBmb2N1c1RyaWdnZXJzS2V5Ym9hcmRNb2RhbGl0eShlbCkge1xuICAgICAgdmFyIHR5cGUgPSBlbC50eXBlO1xuICAgICAgdmFyIHRhZ05hbWUgPSBlbC50YWdOYW1lO1xuXG4gICAgICBpZiAodGFnTmFtZSA9PT0gJ0lOUFVUJyAmJiBpbnB1dFR5cGVzQWxsb3dsaXN0W3R5cGVdICYmICFlbC5yZWFkT25seSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRhZ05hbWUgPT09ICdURVhUQVJFQScgJiYgIWVsLnJlYWRPbmx5KSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZWwuaXNDb250ZW50RWRpdGFibGUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgdGhlIGBmb2N1cy12aXNpYmxlYCBjbGFzcyB0byB0aGUgZ2l2ZW4gZWxlbWVudCBpZiBpdCB3YXMgbm90IGFkZGVkIGJ5XG4gICAgICogdGhlIGF1dGhvci5cbiAgICAgKiBAcGFyYW0ge0VsZW1lbnR9IGVsXG4gICAgICovXG4gICAgZnVuY3Rpb24gYWRkRm9jdXNWaXNpYmxlQ2xhc3MoZWwpIHtcbiAgICAgIGlmIChlbC5jbGFzc0xpc3QuY29udGFpbnMoJ2ZvY3VzLXZpc2libGUnKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBlbC5jbGFzc0xpc3QuYWRkKCdmb2N1cy12aXNpYmxlJyk7XG4gICAgICBlbC5zZXRBdHRyaWJ1dGUoJ2RhdGEtZm9jdXMtdmlzaWJsZS1hZGRlZCcsICcnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW1vdmUgdGhlIGBmb2N1cy12aXNpYmxlYCBjbGFzcyBmcm9tIHRoZSBnaXZlbiBlbGVtZW50IGlmIGl0IHdhcyBub3RcbiAgICAgKiBvcmlnaW5hbGx5IGFkZGVkIGJ5IHRoZSBhdXRob3IuXG4gICAgICogQHBhcmFtIHtFbGVtZW50fSBlbFxuICAgICAqL1xuICAgIGZ1bmN0aW9uIHJlbW92ZUZvY3VzVmlzaWJsZUNsYXNzKGVsKSB7XG4gICAgICBpZiAoIWVsLmhhc0F0dHJpYnV0ZSgnZGF0YS1mb2N1cy12aXNpYmxlLWFkZGVkJykpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZWwuY2xhc3NMaXN0LnJlbW92ZSgnZm9jdXMtdmlzaWJsZScpO1xuICAgICAgZWwucmVtb3ZlQXR0cmlidXRlKCdkYXRhLWZvY3VzLXZpc2libGUtYWRkZWQnKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJZiB0aGUgbW9zdCByZWNlbnQgdXNlciBpbnRlcmFjdGlvbiB3YXMgdmlhIHRoZSBrZXlib2FyZDtcbiAgICAgKiBhbmQgdGhlIGtleSBwcmVzcyBkaWQgbm90IGluY2x1ZGUgYSBtZXRhLCBhbHQvb3B0aW9uLCBvciBjb250cm9sIGtleTtcbiAgICAgKiB0aGVuIHRoZSBtb2RhbGl0eSBpcyBrZXlib2FyZC4gT3RoZXJ3aXNlLCB0aGUgbW9kYWxpdHkgaXMgbm90IGtleWJvYXJkLlxuICAgICAqIEFwcGx5IGBmb2N1cy12aXNpYmxlYCB0byBhbnkgY3VycmVudCBhY3RpdmUgZWxlbWVudCBhbmQga2VlcCB0cmFja1xuICAgICAqIG9mIG91ciBrZXlib2FyZCBtb2RhbGl0eSBzdGF0ZSB3aXRoIGBoYWRLZXlib2FyZEV2ZW50YC5cbiAgICAgKiBAcGFyYW0ge0tleWJvYXJkRXZlbnR9IGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBvbktleURvd24oZSkge1xuICAgICAgaWYgKGUubWV0YUtleSB8fCBlLmFsdEtleSB8fCBlLmN0cmxLZXkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNWYWxpZEZvY3VzVGFyZ2V0KHNjb3BlLmFjdGl2ZUVsZW1lbnQpKSB7XG4gICAgICAgIGFkZEZvY3VzVmlzaWJsZUNsYXNzKHNjb3BlLmFjdGl2ZUVsZW1lbnQpO1xuICAgICAgfVxuXG4gICAgICBoYWRLZXlib2FyZEV2ZW50ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBJZiBhdCBhbnkgcG9pbnQgYSB1c2VyIGNsaWNrcyB3aXRoIGEgcG9pbnRpbmcgZGV2aWNlLCBlbnN1cmUgdGhhdCB3ZSBjaGFuZ2VcbiAgICAgKiB0aGUgbW9kYWxpdHkgYXdheSBmcm9tIGtleWJvYXJkLlxuICAgICAqIFRoaXMgYXZvaWRzIHRoZSBzaXR1YXRpb24gd2hlcmUgYSB1c2VyIHByZXNzZXMgYSBrZXkgb24gYW4gYWxyZWFkeSBmb2N1c2VkXG4gICAgICogZWxlbWVudCwgYW5kIHRoZW4gY2xpY2tzIG9uIGEgZGlmZmVyZW50IGVsZW1lbnQsIGZvY3VzaW5nIGl0IHdpdGggYVxuICAgICAqIHBvaW50aW5nIGRldmljZSwgd2hpbGUgd2Ugc3RpbGwgdGhpbmsgd2UncmUgaW4ga2V5Ym9hcmQgbW9kYWxpdHkuXG4gICAgICogQHBhcmFtIHtFdmVudH0gZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG9uUG9pbnRlckRvd24oZSkge1xuICAgICAgaGFkS2V5Ym9hcmRFdmVudCA9IGZhbHNlO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIGBmb2N1c2AsIGFkZCB0aGUgYGZvY3VzLXZpc2libGVgIGNsYXNzIHRvIHRoZSB0YXJnZXQgaWY6XG4gICAgICogLSB0aGUgdGFyZ2V0IHJlY2VpdmVkIGZvY3VzIGFzIGEgcmVzdWx0IG9mIGtleWJvYXJkIG5hdmlnYXRpb24sIG9yXG4gICAgICogLSB0aGUgZXZlbnQgdGFyZ2V0IGlzIGFuIGVsZW1lbnQgdGhhdCB3aWxsIGxpa2VseSByZXF1aXJlIGludGVyYWN0aW9uXG4gICAgICogICB2aWEgdGhlIGtleWJvYXJkIChlLmcuIGEgdGV4dCBib3gpXG4gICAgICogQHBhcmFtIHtFdmVudH0gZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG9uRm9jdXMoZSkge1xuICAgICAgLy8gUHJldmVudCBJRSBmcm9tIGZvY3VzaW5nIHRoZSBkb2N1bWVudCBvciBIVE1MIGVsZW1lbnQuXG4gICAgICBpZiAoIWlzVmFsaWRGb2N1c1RhcmdldChlLnRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICBpZiAoaGFkS2V5Ym9hcmRFdmVudCB8fCBmb2N1c1RyaWdnZXJzS2V5Ym9hcmRNb2RhbGl0eShlLnRhcmdldCkpIHtcbiAgICAgICAgYWRkRm9jdXNWaXNpYmxlQ2xhc3MoZS50YXJnZXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIE9uIGBibHVyYCwgcmVtb3ZlIHRoZSBgZm9jdXMtdmlzaWJsZWAgY2xhc3MgZnJvbSB0aGUgdGFyZ2V0LlxuICAgICAqIEBwYXJhbSB7RXZlbnR9IGVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBvbkJsdXIoZSkge1xuICAgICAgaWYgKCFpc1ZhbGlkRm9jdXNUYXJnZXQoZS50YXJnZXQpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICBlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2ZvY3VzLXZpc2libGUnKSB8fFxuICAgICAgICBlLnRhcmdldC5oYXNBdHRyaWJ1dGUoJ2RhdGEtZm9jdXMtdmlzaWJsZS1hZGRlZCcpXG4gICAgICApIHtcbiAgICAgICAgLy8gVG8gZGV0ZWN0IGEgdGFiL3dpbmRvdyBzd2l0Y2gsIHdlIGxvb2sgZm9yIGEgYmx1ciBldmVudCBmb2xsb3dlZFxuICAgICAgICAvLyByYXBpZGx5IGJ5IGEgdmlzaWJpbGl0eSBjaGFuZ2UuXG4gICAgICAgIC8vIElmIHdlIGRvbid0IHNlZSBhIHZpc2liaWxpdHkgY2hhbmdlIHdpdGhpbiAxMDBtcywgaXQncyBwcm9iYWJseSBhXG4gICAgICAgIC8vIHJlZ3VsYXIgZm9jdXMgY2hhbmdlLlxuICAgICAgICBoYWRGb2N1c1Zpc2libGVSZWNlbnRseSA9IHRydWU7XG4gICAgICAgIHdpbmRvdy5jbGVhclRpbWVvdXQoaGFkRm9jdXNWaXNpYmxlUmVjZW50bHlUaW1lb3V0KTtcbiAgICAgICAgaGFkRm9jdXNWaXNpYmxlUmVjZW50bHlUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgaGFkRm9jdXNWaXNpYmxlUmVjZW50bHkgPSBmYWxzZTtcbiAgICAgICAgfSwgMTAwKTtcbiAgICAgICAgcmVtb3ZlRm9jdXNWaXNpYmxlQ2xhc3MoZS50YXJnZXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIElmIHRoZSB1c2VyIGNoYW5nZXMgdGFicywga2VlcCB0cmFjayBvZiB3aGV0aGVyIG9yIG5vdCB0aGUgcHJldmlvdXNseVxuICAgICAqIGZvY3VzZWQgZWxlbWVudCBoYWQgLmZvY3VzLXZpc2libGUuXG4gICAgICogQHBhcmFtIHtFdmVudH0gZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIG9uVmlzaWJpbGl0eUNoYW5nZShlKSB7XG4gICAgICBpZiAoZG9jdW1lbnQudmlzaWJpbGl0eVN0YXRlID09PSAnaGlkZGVuJykge1xuICAgICAgICAvLyBJZiB0aGUgdGFiIGJlY29tZXMgYWN0aXZlIGFnYWluLCB0aGUgYnJvd3NlciB3aWxsIGhhbmRsZSBjYWxsaW5nIGZvY3VzXG4gICAgICAgIC8vIG9uIHRoZSBlbGVtZW50IChTYWZhcmkgYWN0dWFsbHkgY2FsbHMgaXQgdHdpY2UpLlxuICAgICAgICAvLyBJZiB0aGlzIHRhYiBjaGFuZ2UgY2F1c2VkIGEgYmx1ciBvbiBhbiBlbGVtZW50IHdpdGggZm9jdXMtdmlzaWJsZSxcbiAgICAgICAgLy8gcmUtYXBwbHkgdGhlIGNsYXNzIHdoZW4gdGhlIHVzZXIgc3dpdGNoZXMgYmFjayB0byB0aGUgdGFiLlxuICAgICAgICBpZiAoaGFkRm9jdXNWaXNpYmxlUmVjZW50bHkpIHtcbiAgICAgICAgICBoYWRLZXlib2FyZEV2ZW50ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICBhZGRJbml0aWFsUG9pbnRlck1vdmVMaXN0ZW5lcnMoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBBZGQgYSBncm91cCBvZiBsaXN0ZW5lcnMgdG8gZGV0ZWN0IHVzYWdlIG9mIGFueSBwb2ludGluZyBkZXZpY2VzLlxuICAgICAqIFRoZXNlIGxpc3RlbmVycyB3aWxsIGJlIGFkZGVkIHdoZW4gdGhlIHBvbHlmaWxsIGZpcnN0IGxvYWRzLCBhbmQgYW55dGltZVxuICAgICAqIHRoZSB3aW5kb3cgaXMgYmx1cnJlZCwgc28gdGhhdCB0aGV5IGFyZSBhY3RpdmUgd2hlbiB0aGUgd2luZG93IHJlZ2FpbnNcbiAgICAgKiBmb2N1cy5cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBhZGRJbml0aWFsUG9pbnRlck1vdmVMaXN0ZW5lcnMoKSB7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbkluaXRpYWxQb2ludGVyTW92ZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBvbkluaXRpYWxQb2ludGVyTW92ZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25Jbml0aWFsUG9pbnRlck1vdmUpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBvbkluaXRpYWxQb2ludGVyTW92ZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIG9uSW5pdGlhbFBvaW50ZXJNb3ZlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIG9uSW5pdGlhbFBvaW50ZXJNb3ZlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uSW5pdGlhbFBvaW50ZXJNb3ZlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvbkluaXRpYWxQb2ludGVyTW92ZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uSW5pdGlhbFBvaW50ZXJNb3ZlKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZW1vdmVJbml0aWFsUG9pbnRlck1vdmVMaXN0ZW5lcnMoKSB7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbkluaXRpYWxQb2ludGVyTW92ZSk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZWRvd24nLCBvbkluaXRpYWxQb2ludGVyTW92ZSk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3VzZXVwJywgb25Jbml0aWFsUG9pbnRlck1vdmUpO1xuICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCBvbkluaXRpYWxQb2ludGVyTW92ZSk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIG9uSW5pdGlhbFBvaW50ZXJNb3ZlKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIG9uSW5pdGlhbFBvaW50ZXJNb3ZlKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uSW5pdGlhbFBvaW50ZXJNb3ZlKTtcbiAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvbkluaXRpYWxQb2ludGVyTW92ZSk7XG4gICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCd0b3VjaGVuZCcsIG9uSW5pdGlhbFBvaW50ZXJNb3ZlKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXaGVuIHRoZSBwb2xmeWlsbCBmaXJzdCBsb2FkcywgYXNzdW1lIHRoZSB1c2VyIGlzIGluIGtleWJvYXJkIG1vZGFsaXR5LlxuICAgICAqIElmIGFueSBldmVudCBpcyByZWNlaXZlZCBmcm9tIGEgcG9pbnRpbmcgZGV2aWNlIChlLmcuIG1vdXNlLCBwb2ludGVyLFxuICAgICAqIHRvdWNoKSwgdHVybiBvZmYga2V5Ym9hcmQgbW9kYWxpdHkuXG4gICAgICogVGhpcyBhY2NvdW50cyBmb3Igc2l0dWF0aW9ucyB3aGVyZSBmb2N1cyBlbnRlcnMgdGhlIHBhZ2UgZnJvbSB0aGUgVVJMIGJhci5cbiAgICAgKiBAcGFyYW0ge0V2ZW50fSBlXG4gICAgICovXG4gICAgZnVuY3Rpb24gb25Jbml0aWFsUG9pbnRlck1vdmUoZSkge1xuICAgICAgLy8gV29yayBhcm91bmQgYSBTYWZhcmkgcXVpcmsgdGhhdCBmaXJlcyBhIG1vdXNlbW92ZSBvbiA8aHRtbD4gd2hlbmV2ZXIgdGhlXG4gICAgICAvLyB3aW5kb3cgYmx1cnMsIGV2ZW4gaWYgeW91J3JlIHRhYmJpbmcgb3V0IG9mIHRoZSBwYWdlLiDCr1xcXyjjg4QpXy/Cr1xuICAgICAgaWYgKGUudGFyZ2V0Lm5vZGVOYW1lICYmIGUudGFyZ2V0Lm5vZGVOYW1lLnRvTG93ZXJDYXNlKCkgPT09ICdodG1sJykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGhhZEtleWJvYXJkRXZlbnQgPSBmYWxzZTtcbiAgICAgIHJlbW92ZUluaXRpYWxQb2ludGVyTW92ZUxpc3RlbmVycygpO1xuICAgIH1cblxuICAgIC8vIEZvciBzb21lIGtpbmRzIG9mIHN0YXRlLCB3ZSBhcmUgaW50ZXJlc3RlZCBpbiBjaGFuZ2VzIGF0IHRoZSBnbG9iYWwgc2NvcGVcbiAgICAvLyBvbmx5LiBGb3IgZXhhbXBsZSwgZ2xvYmFsIHBvaW50ZXIgaW5wdXQsIGdsb2JhbCBrZXkgcHJlc3NlcyBhbmQgZ2xvYmFsXG4gICAgLy8gdmlzaWJpbGl0eSBjaGFuZ2Ugc2hvdWxkIGFmZmVjdCB0aGUgc3RhdGUgYXQgZXZlcnkgc2NvcGU6XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5RG93biwgdHJ1ZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgb25Qb2ludGVyRG93biwgdHJ1ZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCBvblBvaW50ZXJEb3duLCB0cnVlKTtcbiAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd0b3VjaHN0YXJ0Jywgb25Qb2ludGVyRG93biwgdHJ1ZSk7XG4gICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigndmlzaWJpbGl0eWNoYW5nZScsIG9uVmlzaWJpbGl0eUNoYW5nZSwgdHJ1ZSk7XG5cbiAgICBhZGRJbml0aWFsUG9pbnRlck1vdmVMaXN0ZW5lcnMoKTtcblxuICAgIC8vIEZvciBmb2N1cyBhbmQgYmx1ciwgd2Ugc3BlY2lmaWNhbGx5IGNhcmUgYWJvdXQgc3RhdGUgY2hhbmdlcyBpbiB0aGUgbG9jYWxcbiAgICAvLyBzY29wZS4gVGhpcyBpcyBiZWNhdXNlIGZvY3VzIC8gYmx1ciBldmVudHMgdGhhdCBvcmlnaW5hdGUgZnJvbSB3aXRoaW4gYVxuICAgIC8vIHNoYWRvdyByb290IGFyZSBub3QgcmUtZGlzcGF0Y2hlZCBmcm9tIHRoZSBob3N0IGVsZW1lbnQgaWYgaXQgd2FzIGFscmVhZHlcbiAgICAvLyB0aGUgYWN0aXZlIGVsZW1lbnQgaW4gaXRzIG93biBzY29wZTpcbiAgICBzY29wZS5hZGRFdmVudExpc3RlbmVyKCdmb2N1cycsIG9uRm9jdXMsIHRydWUpO1xuICAgIHNjb3BlLmFkZEV2ZW50TGlzdGVuZXIoJ2JsdXInLCBvbkJsdXIsIHRydWUpO1xuXG4gICAgLy8gV2UgZGV0ZWN0IHRoYXQgYSBub2RlIGlzIGEgU2hhZG93Um9vdCBieSBlbnN1cmluZyB0aGF0IGl0IGlzIGFcbiAgICAvLyBEb2N1bWVudEZyYWdtZW50IGFuZCBhbHNvIGhhcyBhIGhvc3QgcHJvcGVydHkuIFRoaXMgY2hlY2sgY292ZXJzIG5hdGl2ZVxuICAgIC8vIGltcGxlbWVudGF0aW9uIGFuZCBwb2x5ZmlsbCBpbXBsZW1lbnRhdGlvbiB0cmFuc3BhcmVudGx5LiBJZiB3ZSBvbmx5IGNhcmVkXG4gICAgLy8gYWJvdXQgdGhlIG5hdGl2ZSBpbXBsZW1lbnRhdGlvbiwgd2UgY291bGQganVzdCBjaGVjayBpZiB0aGUgc2NvcGUgd2FzXG4gICAgLy8gYW4gaW5zdGFuY2Ugb2YgYSBTaGFkb3dSb290LlxuICAgIGlmIChzY29wZS5ub2RlVHlwZSA9PT0gTm9kZS5ET0NVTUVOVF9GUkFHTUVOVF9OT0RFICYmIHNjb3BlLmhvc3QpIHtcbiAgICAgIC8vIFNpbmNlIGEgU2hhZG93Um9vdCBpcyBhIHNwZWNpYWwga2luZCBvZiBEb2N1bWVudEZyYWdtZW50LCBpdCBkb2VzIG5vdFxuICAgICAgLy8gaGF2ZSBhIHJvb3QgZWxlbWVudCB0byBhZGQgYSBjbGFzcyB0by4gU28sIHdlIGFkZCB0aGlzIGF0dHJpYnV0ZSB0byB0aGVcbiAgICAgIC8vIGhvc3QgZWxlbWVudCBpbnN0ZWFkOlxuICAgICAgc2NvcGUuaG9zdC5zZXRBdHRyaWJ1dGUoJ2RhdGEtanMtZm9jdXMtdmlzaWJsZScsICcnKTtcbiAgICB9IGVsc2UgaWYgKHNjb3BlLm5vZGVUeXBlID09PSBOb2RlLkRPQ1VNRU5UX05PREUpIHtcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGFzc0xpc3QuYWRkKCdqcy1mb2N1cy12aXNpYmxlJyk7XG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc2V0QXR0cmlidXRlKCdkYXRhLWpzLWZvY3VzLXZpc2libGUnLCAnJyk7XG4gICAgfVxuICB9XG5cbiAgLy8gSXQgaXMgaW1wb3J0YW50IHRvIHdyYXAgYWxsIHJlZmVyZW5jZXMgdG8gZ2xvYmFsIHdpbmRvdyBhbmQgZG9jdW1lbnQgaW5cbiAgLy8gdGhlc2UgY2hlY2tzIHRvIHN1cHBvcnQgc2VydmVyLXNpZGUgcmVuZGVyaW5nIHVzZSBjYXNlc1xuICAvLyBAc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9XSUNHL2ZvY3VzLXZpc2libGUvaXNzdWVzLzE5OVxuICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcgJiYgdHlwZW9mIGRvY3VtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgIC8vIE1ha2UgdGhlIHBvbHlmaWxsIGhlbHBlciBnbG9iYWxseSBhdmFpbGFibGUuIFRoaXMgY2FuIGJlIHVzZWQgYXMgYSBzaWduYWxcbiAgICAvLyB0byBpbnRlcmVzdGVkIGxpYnJhcmllcyB0aGF0IHdpc2ggdG8gY29vcmRpbmF0ZSB3aXRoIHRoZSBwb2x5ZmlsbCBmb3IgZS5nLixcbiAgICAvLyBhcHBseWluZyB0aGUgcG9seWZpbGwgdG8gYSBzaGFkb3cgcm9vdDpcbiAgICB3aW5kb3cuYXBwbHlGb2N1c1Zpc2libGVQb2x5ZmlsbCA9IGFwcGx5Rm9jdXNWaXNpYmxlUG9seWZpbGw7XG5cbiAgICAvLyBOb3RpZnkgaW50ZXJlc3RlZCBsaWJyYXJpZXMgb2YgdGhlIHBvbHlmaWxsJ3MgcHJlc2VuY2UsIGluIGNhc2UgdGhlXG4gICAgLy8gcG9seWZpbGwgd2FzIGxvYWRlZCBsYXppbHk6XG4gICAgdmFyIGV2ZW50O1xuXG4gICAgdHJ5IHtcbiAgICAgIGV2ZW50ID0gbmV3IEN1c3RvbUV2ZW50KCdmb2N1cy12aXNpYmxlLXBvbHlmaWxsLXJlYWR5Jyk7XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIC8vIElFMTEgZG9lcyBub3Qgc3VwcG9ydCB1c2luZyBDdXN0b21FdmVudCBhcyBhIGNvbnN0cnVjdG9yIGRpcmVjdGx5OlxuICAgICAgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnQ3VzdG9tRXZlbnQnKTtcbiAgICAgIGV2ZW50LmluaXRDdXN0b21FdmVudCgnZm9jdXMtdmlzaWJsZS1wb2x5ZmlsbC1yZWFkeScsIGZhbHNlLCBmYWxzZSwge30pO1xuICAgIH1cblxuICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgfVxuXG4gIGlmICh0eXBlb2YgZG9jdW1lbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgLy8gQXBwbHkgdGhlIHBvbHlmaWxsIHRvIHRoZSBnbG9iYWwgZG9jdW1lbnQsIHNvIHRoYXQgbm8gSmF2YVNjcmlwdFxuICAgIC8vIGNvb3JkaW5hdGlvbiBpcyByZXF1aXJlZCB0byB1c2UgdGhlIHBvbHlmaWxsIGluIHRoZSB0b3AtbGV2ZWwgZG9jdW1lbnQ6XG4gICAgYXBwbHlGb2N1c1Zpc2libGVQb2x5ZmlsbChkb2N1bWVudCk7XG4gIH1cblxufSkpKTtcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IFVzZXIgb24gMDEwIDEwLjA2LjIxLlxyXG4gKi9cclxuXHJcbmV4cG9ydCBkZWZhdWx0IChmbikgPT4ge1xyXG4gICAgaWYgKGRvY3VtZW50LnJlYWR5U3RhdGUgPT09ICdsb2FkaW5nJykge1xyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBmbilcclxuICAgIH1cclxuICAgIGVsc2V7XHJcbiAgICAgICAgZm4oKTtcclxuICAgIH1cclxufSIsIi8qKlxuICogQ3JlYXRlZCBieSBVc2VyIG9uIDAyMiAyMi4wNS4yMS5cbiAqL1xuXG5pbXBvcnQgJ2ZvY3VzLXZpc2libGUnO1xuaW1wb3J0IGFqYXhRdWVyeSBmcm9tICcuL21vZHVsZXMvYWpheFF1ZXJ5JztcbmltcG9ydCBwb3B1cEZvcm0gZnJvbSAnLi9tb2R1bGVzL3BvcHVwRm9ybSc7XG5cbmltcG9ydCBkb2N1bWVudFJlYWR5IGZyb20gJy4vaGVscGVycy9kb2N1bWVudFJlYWR5JztcblxuZG9jdW1lbnRSZWFkeSgoKT0+e1xuICAgIGFqYXhRdWVyeSgpO1xuICAgIHBvcHVwRm9ybSgpO1xufSlcblxuXG5cblxuXG4iLCIvKipcclxuICogQ3JlYXRlZCBieSBVc2VyIG9uIDAxOSAxOS4wOC4yMS5cclxuICovXHJcblxyXG5leHBvcnQgZGVmYXVsdCAoKSA9PiB7XHJcblxyXG4gICAgY29uc3QgYm9keVNjcm9sbGluZ1RvZ2dsZSA9ICgpID0+IHtcclxuICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC50b2dnbGUoXCJzdG9wLXNjcm9sbGluZ1wiKTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgZnVuY3Rpb24gYWpheCh1cmwsIG1ldGhvZCwgZnVuY3Rpb25OYW1lLCBkYXRhQXJyYXkpIHtcclxuICAgICAgICBsZXQgeGh0dHAgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcclxuICAgICAgICB4aHR0cC5vcGVuKG1ldGhvZCwgdXJsLCB0cnVlKTtcclxuICAgICAgICB4aHR0cC5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyk7XHJcbiAgICAgICAgeGh0dHAuc2VuZChyZXF1ZXN0RGF0YShkYXRhQXJyYXkpKTtcclxuXHJcbiAgICAgICAgeGh0dHAub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBpZiAodGhpcy5yZWFkeVN0YXRlID09IDQgJiYgdGhpcy5zdGF0dXMgPT0gMjAwKSB7XHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbk5hbWUodGhpcyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gcmVxdWVzdERhdGEoZGF0YUFycikge1xyXG4gICAgICAgIGxldCBvdXQgPSBcIlwiO1xyXG4gICAgICAgIGZvciAobGV0IGtleSBpbiBkYXRhQXJyKSB7XHJcbiAgICAgICAgICAgIG91dCArPSBgJHtrZXl9PSR7ZGF0YUFycltrZXldfSZgO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gb3V0O1xyXG5cclxuICAgIH1cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbiAgICBsZXQgYnRuUG9zdCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5idG5Qb3N0JyksXHJcbiAgICAgICAgY29tbWVudFBvc3QgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYWRkQ29tbWVudEJ0bicpLFxyXG4gICAgICAgIGFkZENvbW1lbnQgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuYWRkQ29tbWVudCcpLFxyXG4gICAgICAgIHRpdGxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnRpdGxlJyksXHJcbiAgICAgICAgYXV0aG9yID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmF1dGhvcicpLFxyXG4gICAgICAgIHNob3J0RGVzY3JpcHRpb24gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuc2hvcnRfZGVzY3JpcHRpb24nKSxcclxuICAgICAgICBtZXNzYWdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmZ1bGxfZGVzY3JpcHRpb24nKSxcclxuICAgICAgICBjb21tZW50YXRvciA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5maXJzdE5hbWUnKSxcclxuICAgICAgICBjb21tZW50ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmNvbW1lbnQnKSxcclxuICAgICAgICBtYWluU2VjdGlvbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tZXNzYWdlX2xpc3QnKSxcclxuICAgICAgICBpZEZpZWxkID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmlkRmllbGQnKSxcclxuICAgICAgICBwb3B1cFdpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wb3B1cC1mb3JtJyksXHJcbiAgICAgICAgcG9wdXBDb21tZW50V2luZG93ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBvcHVwLWNvbW1lbnQtZm9ybScpLFxyXG4gICAgICAgIHBvcHVwRWRpdFdpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wb3B1cC1lZGl0LWZvcm0nKSxcclxuICAgICAgICBtZXNzYWdlZm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2Zvcm0nKSxcclxuICAgICAgICBjb21tZW50Zm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5wb3B1cC1jb21tZW50LWZvcm0gZm9ybScpO1xyXG5cclxuICAgIGxldCBjb21tZW50c0Jsb2NrO1xyXG4gICAgbGV0IG1lc3NhZ2VzQXJyYXkgPSBbXTtcclxuICAgIGxldCBpZFVwZGF0ZUZpZWxkO1xyXG5cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbiAgICBidG5Qb3N0LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgZnVuY3Rpb24gKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgIGlmKHRpdGxlLnZhbHVlID09ICcnKXtcclxuICAgICAgICAgICAgdGl0bGUucGxhY2Vob2xkZXIgPSAnVGl0bGUgc2hvdWxkIG5vdCBiZSBlbXB0eSEnO1xyXG4gICAgICAgICAgICB0aXRsZS5jbGFzc0xpc3QuYWRkKCdjb2xvclBsYWNlaG9sZGVyJyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmKGF1dGhvci52YWx1ZSA9PSAnJyl7XHJcbiAgICAgICAgICAgIGF1dGhvci5wbGFjZWhvbGRlciA9ICdBdXRob3Igc2hvdWxkIG5vdCBiZSBlbXB0eSEnO1xyXG4gICAgICAgICAgICBhdXRob3IuY2xhc3NMaXN0LmFkZCgnY29sb3JQbGFjZWhvbGRlcicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoc2hvcnREZXNjcmlwdGlvbi52YWx1ZSA9PSAnJyl7XHJcbiAgICAgICAgICAgIHNob3J0RGVzY3JpcHRpb24ucGxhY2Vob2xkZXIgPSAnU2hvcnQgRGVzY3JpcHRpb24gc2hvdWxkIG5vdCBiZSBlbXB0eSEnO1xyXG4gICAgICAgICAgICBzaG9ydERlc2NyaXB0aW9uLmNsYXNzTGlzdC5hZGQoJ2NvbG9yUGxhY2Vob2xkZXInKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmKG1lc3NhZ2UudmFsdWUgPT0gJycpe1xyXG4gICAgICAgICAgICBtZXNzYWdlLnBsYWNlaG9sZGVyID0gJ01lc3NhZ2UgZmllbGQgc2hvdWxkIG5vdCBiZSBlbXB0eSEnO1xyXG4gICAgICAgICAgICBtZXNzYWdlLmNsYXNzTGlzdC5hZGQoJ2NvbG9yUGxhY2Vob2xkZXInKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGVsc2UgaWYodGl0bGUudmFsdWUgIT0gJycgJiYgYXV0aG9yLnZhbHVlICE9ICcnICYmIHNob3J0RGVzY3JpcHRpb24udmFsdWUgIT0gJycgJiYgbWVzc2FnZS52YWx1ZSAhPSAnJyl7XHJcbiAgICAgICAgICAgIGxldCBkYXRhQXJyID0ge1xyXG4gICAgICAgICAgICAgICAgXCJwb3N0TWVzc2FnZVwiOiBidG5Qb3N0LFxyXG4gICAgICAgICAgICAgICAgXCJ0aXRsZVwiOiBgJHt0aXRsZS52YWx1ZX1gLFxyXG4gICAgICAgICAgICAgICAgXCJhdXRob3JcIjogYCR7YXV0aG9yLnZhbHVlfWAsXHJcbiAgICAgICAgICAgICAgICBcInNob3J0RGVzY3JpcHRpb25cIjogYCR7c2hvcnREZXNjcmlwdGlvbi52YWx1ZX1gLFxyXG4gICAgICAgICAgICAgICAgXCJtZXNzYWdlXCI6IGAke21lc3NhZ2UudmFsdWV9YFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBhamF4KCdmZXRjaC5waHAnLCAncG9zdCcsIHNob3dNZXNzYWdlcywgZGF0YUFycik7XHJcbiAgICAgICAgICAgIGZvcm0ucmVzZXQoKTtcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuICAgIGFkZENvbW1lbnQuZm9yRWFjaCgoaXRlbSkgPT4ge1xyXG4gICAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChlKSA9PiB7XHJcbiAgICAgICAgICAgIGlkRmllbGQudmFsdWUgPSBlLnRhcmdldC5pZDtcclxuICAgICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbiAgICBjb21tZW50UG9zdC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICBpZihjb21tZW50YXRvci52YWx1ZSA9PSAnJyl7XHJcbiAgICAgICAgICAgIGNvbW1lbnRhdG9yLnBsYWNlaG9sZGVyID0gJ0NvbW1lbnRhdG9yIHNob3VsZCBub3QgYmUgZW1wdHkhJztcclxuICAgICAgICAgICAgY29tbWVudGF0b3IuY2xhc3NMaXN0LmFkZCgnY29sb3JQbGFjZWhvbGRlcicpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBpZihjb21tZW50LnZhbHVlID09ICcnKXtcclxuICAgICAgICAgICAgY29tbWVudC5wbGFjZWhvbGRlciA9ICdDb21tZW50IHNob3VsZCBub3QgYmUgZW1wdHkhJztcclxuICAgICAgICAgICAgY29tbWVudC5jbGFzc0xpc3QuYWRkKCdjb2xvclBsYWNlaG9sZGVyJyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBlbHNlIGlmKGNvbW1lbnRhdG9yLnZhbHVlICE9ICcnICYmIGNvbW1lbnQudmFsdWUgIT0gJycpe1xyXG4gICAgICAgICAgICBsZXQgZGF0YUFyciA9IHtcclxuICAgICAgICAgICAgICAgIFwicG9zdENvbW1lbnRCdG5cIjogY29tbWVudFBvc3QsXHJcbiAgICAgICAgICAgICAgICBcImNvbW1lbnRhdG9yXCI6IGAke2NvbW1lbnRhdG9yLnZhbHVlfWAsXHJcbiAgICAgICAgICAgICAgICBcImNvbW1lbnRcIjogYCR7Y29tbWVudC52YWx1ZX1gLFxyXG4gICAgICAgICAgICAgICAgXCJtZXNzYWdlSURcIjogYCR7aWRGaWVsZC52YWx1ZX1gXHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBhamF4KCdmZXRjaENvbW1lbnQucGhwJywgJ3Bvc3QnLCBpbnNlcnRDb21tZW50cywgZGF0YUFycik7XHJcbiAgICAgICAgICAgIGNvbW1lbnRmb3JtLnJlc2V0KCk7XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICB9KTtcclxuXHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcblxyXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBsZXQgZGF0YUFyckxvYWQgPSB7XHJcbiAgICAgICAgICAgIFwid2luZG93TG9hZGVkXCI6IHRydWUsXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgYWpheCgnZmV0Y2gucGhwJywgJ3Bvc3QnLCBzaG93RGF0YU9uTG9hZCwgZGF0YUFyckxvYWQpO1xyXG4gICAgfSk7XHJcblxyXG4vLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbiAgICBmdW5jdGlvbiBzaG93TWVzc2FnZXMoZGF0YUF0cnIpIHtcclxuXHJcbiAgICAgICAgcG9wdXBXaW5kb3cuY2xhc3NMaXN0LnJlbW92ZShcIm9wZW5cIik7XHJcbiAgICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XHJcblxyXG4gICAgfVxyXG5cclxuLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS1zaG93RGF0YU9uTG9hZC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbiAgICBmdW5jdGlvbiBzaG93RGF0YU9uTG9hZChkYXRhQXRycikge1xyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLUdldHRpbmcgRGF0YSBGcm9tIFRhYmxlIE1lc3NhZ2VzLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG4gICAgICAgIGxldCBhcnIgPSBKU09OLnBhcnNlKGRhdGFBdHJyLnJlc3BvbnNlKTtcclxuXHJcblxyXG4gICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tQ3JlYXRpbmcgTWVzc2FnZSBEaXYtLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG4gICAgICAgIGFyci5mb3JFYWNoKChpdGVtKSA9PiB7XHJcbiAgICAgICAgICAgIGxldCBtZXNzYWdlQmxvY2sgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xyXG4gICAgICAgICAgICBtZXNzYWdlQmxvY2suY2xhc3NMaXN0LmFkZChcIm1lc3NhZ2UtYmxvY2tcIik7XHJcbiAgICAgICAgICAgIG1lc3NhZ2VCbG9jay5pbm5lckhUTUwgPSAnPGRpdiBjbGFzcz1cIm1lc3NhZ2UtdGl0bGVcIj48Yj5UaXRsZTogPC9iPjxicj48YnI+JyArIGl0ZW0udGl0bGUgKyAnPC9kaXY+XFxcclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3M9XCJtZXNzYWdlX19zaG9ydC1kZXNjcmlwdGlvblwiPjxicj48Yj5TaG9ydCBkZXNjcmlwdGlvbjogPC9iPjxicj48cD4nICsgaXRlbS5kZXNjcmlwdGlvbiArICc8L3A+PC9kaXY+XFxcclxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJhZGRDb21tZW50XCIgaWQgPVwiJyArIGl0ZW0uaWQgKyAnXCI+UG9zdCBhIGNvbW1lbnQ8L2J1dHRvbj4gXFxcclxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJ2aWV3SGlkZUNvbW1lbnRzXCIgaWQgPVwiJyArIGl0ZW0uaWQgKyAnXCI+VmlldyAgY29tbWVudHM8L2J1dHRvbj4gXFxcclxuICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJlZGl0TWVzc2FnZVwiIGlkID1cIicgKyBpdGVtLmlkICsgJ1wiPkVkaXQgbWVzc2FnZTwvYnV0dG9uPiBcXFxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzcz1cImNvbW1lbnRzQmxvY2sgaGlkZVwiPkhpIHRoZXJlITwvZGl2PlxcXHJcbiAgICAgICAgICAgICAgICA8aHI+JztcclxuXHJcblxyXG4gICAgICAgICAgICBsZXQgY29tbWVudHNCbG9jayA9IG1lc3NhZ2VCbG9jay5xdWVyeVNlbGVjdG9yKCcuY29tbWVudHNCbG9jaycpO1xyXG4gICAgICAgICAgICBjb21tZW50c0Jsb2NrLmlubmVySFRNTCA9ICcnO1xyXG5cclxuICAgICAgICAgICAgbWVzc2FnZXNBcnJheS5wdXNoKG1lc3NhZ2VCbG9jayk7XHJcblxyXG5cclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgIGRpc3BsYXlMaXN0KG1lc3NhZ2VzQXJyYXksIG1lc3NhZ2VzTGlzdCwgcm93cywgY3VycmVudFBhZ2UpO1xyXG4gICAgICAgIHNldHVwUGFnaW5hdGlvbihtZXNzYWdlc0FycmF5LHBhZ2VOdW1iZXJzLHJvd3MpO1xyXG5cclxuICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLUNsaWNraW5nIG9uIGEgXCJQb3N0IGEgQ29tbWVudFwiIGJ1dHRvbi0tLS0tLS0tLS0tLS0tLS0tLy9cclxuXHJcbiAgICAgICAgbGV0IGFkZENvbW1lbnRCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLmFkZENvbW1lbnRcIiksXHJcbiAgICAgICAgICAgIHZpZXdIaWRlQ29tbWVudHNCdG4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLnZpZXdIaWRlQ29tbWVudHNcIiksXHJcbiAgICAgICAgICAgIGlkRmllbGQgPSBwb3B1cENvbW1lbnRXaW5kb3cucXVlcnlTZWxlY3RvcihcIi5pZEZpZWxkXCIpLFxyXG4gICAgICAgICAgICBjbG9zZUNvbW1lbnRXaW5kb3dCdG4gPSBwb3B1cENvbW1lbnRXaW5kb3cucXVlcnlTZWxlY3RvcihcIi5jbG9zZS1mb3JtLW1lbnVcIiksXHJcbiAgICAgICAgICAgIGNsb3NlRWRpdFdpbmRvd0J0biA9IHBvcHVwRWRpdFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLmNsb3NlLWZvcm0tbWVudVwiKTtcclxuXHJcbiAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZSk9PntcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICBpZihlLnRhcmdldC5jbGFzc0xpc3QuY29udGFpbnMoJ2FkZENvbW1lbnQnKSl7XHJcbiAgICAgICAgICAgICAgICBwb3B1cENvbW1lbnRXaW5kb3cuY2xhc3NMaXN0LmFkZChcIm9wZW5cIik7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmZhZGUtb3V0LWVmZmVjdFwiKS5jbGFzc0xpc3QuYWRkKFwiYWN0aXZlXCIpO1xyXG4gICAgICAgICAgICAgICAgaWRGaWVsZC52YWx1ZSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImlkXCIpO1xyXG4gICAgICAgICAgICAgICAgYm9keVNjcm9sbGluZ1RvZ2dsZSgpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvLy0tLS0tLS0tLS0tLS0tLUNsaWNraW5nIG9uIGEgXCJWaWV3IENvbW1lbnRzXCIgYnV0dG9uLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuICAgICAgICAgICAgaWYoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCd2aWV3SGlkZUNvbW1lbnRzJykpe1xyXG4gICAgICAgICAgICAgICAgbGV0IGRhdGFBcnIgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJ2aWV3Q29tbWVudEJ0blwiOiBlLnRhcmdldCxcclxuICAgICAgICAgICAgICAgICAgICBcIml0ZW1JRFwiOiBgJHtlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2lkJyl9YCxcclxuICAgICAgICAgICAgICAgICAgICBcImNvbW1lbnRQb3N0ZWRcIjogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb21tZW50c0Jsb2NrID0gZS50YXJnZXQuY2xvc2VzdChcIi5tZXNzYWdlLWJsb2NrXCIpLnF1ZXJ5U2VsZWN0b3IoXCIuY29tbWVudHNCbG9ja1wiKTtcclxuXHJcbiAgICAgICAgICAgICAgICBhamF4KCdmZXRjaENvbW1lbnQucGhwJywgJ3Bvc3QnLCBzaG93Q29tbWVudHMsIGRhdGFBcnIpO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmIChlLnRhcmdldC5wYXJlbnROb2RlLnF1ZXJ5U2VsZWN0b3IoXCIuY29tbWVudHNCbG9ja1wiKS5jbGFzc0xpc3QuY29udGFpbnMoXCJoaWRlXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZS50YXJnZXQucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yKFwiLmNvbW1lbnRzQmxvY2tcIikuY2xhc3NMaXN0LnRvZ2dsZShcImhpZGVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgZS50YXJnZXQuaW5uZXJIVE1MID0gXCJIaWRlIGNvbW1lbnRzXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZS50YXJnZXQucGFyZW50Tm9kZS5xdWVyeVNlbGVjdG9yKFwiLmNvbW1lbnRzQmxvY2tcIikuY2xhc3NMaXN0LnRvZ2dsZShcImhpZGVcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGUudGFyZ2V0LmlubmVySFRNTCA9IFwiVmlldyBjb21tZW50c1wiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgICAgIC8vLS0tLS0tLS0tLS0tLS0tQ2xpY2tpbmcgb24gYSBcIkVkaXQgbWVzc2FnZVwiIGJ1dHRvbi0tLS0tLS0tLS0tLS0tLS0tLy9cclxuICAgICAgICAgICAgaWYoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdlZGl0TWVzc2FnZScpKXtcclxuICAgICAgICAgICAgICAgIGlkVXBkYXRlRmllbGQgPSBwb3B1cEVkaXRXaW5kb3cucXVlcnlTZWxlY3RvcignLmlkRmllbGQnKTtcclxuICAgICAgICAgICAgICAgIGxldCBkYXRhQXJyID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VCdG5cIjogZS50YXJnZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJtZXNzYWdlRWRpdElEXCI6IGAke2UudGFyZ2V0LmdldEF0dHJpYnV0ZSgnaWQnKX1gLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWRpdE1lc3NhZ2VcIjogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICBwb3B1cEVkaXRXaW5kb3cuY2xhc3NMaXN0LmFkZChcIm9wZW5cIik7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKFwiLmZhZGUtb3V0LWVmZmVjdFwiKS5jbGFzc0xpc3QuYWRkKFwiYWN0aXZlXCIpO1xyXG4gICAgICAgICAgICAgICAgaWRVcGRhdGVGaWVsZC52YWx1ZSA9IGUudGFyZ2V0LmdldEF0dHJpYnV0ZShcImlkXCIpO1xyXG4gICAgICAgICAgICAgICAgYm9keVNjcm9sbGluZ1RvZ2dsZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIGFqYXgoJ2VkaXRNZXNzYWdlLnBocCcsICdwb3N0JywgZWRpdE1lc3NhZ2UsIGRhdGFBcnIpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgaWYoZS50YXJnZXQuY2xhc3NMaXN0LmNvbnRhaW5zKCdidG5FZGl0Jykpe1xyXG4gICAgICAgICAgICAgICAgbGV0IHRpdGxlVXBkYXRlID0gcG9wdXBFZGl0V2luZG93LnF1ZXJ5U2VsZWN0b3IoXCIudGl0bGVcIik7XHJcbiAgICAgICAgICAgICAgICBsZXQgdGl0bGVVcGRhdGVWYWx1ZSA9IHBvcHVwRWRpdFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLnRpdGxlXCIpLnZhbHVlO1xyXG4gICAgICAgICAgICAgICAgbGV0IGF1dGhvclVwZGF0ZSA9IHBvcHVwRWRpdFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLmF1dGhvclwiKTtcclxuICAgICAgICAgICAgICAgIGxldCBhdXRob3JVcGRhdGVWYWx1ZSA9IHBvcHVwRWRpdFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLmF1dGhvclwiKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBkZXNjcmlwdGlvblVwZGF0ZSA9IHBvcHVwRWRpdFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLnNob3J0X2Rlc2NyaXB0aW9uXCIpO1xyXG4gICAgICAgICAgICAgICAgbGV0IGRlc2NyaXB0aW9uVXBkYXRlVmFsdWUgPSBwb3B1cEVkaXRXaW5kb3cucXVlcnlTZWxlY3RvcihcIi5zaG9ydF9kZXNjcmlwdGlvblwiKS52YWx1ZTtcclxuICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlVXBkYXRlID0gcG9wdXBFZGl0V2luZG93LnF1ZXJ5U2VsZWN0b3IoXCIuZnVsbF9kZXNjcmlwdGlvblwiKTtcclxuICAgICAgICAgICAgICAgIGxldCBtZXNzYWdlVXBkYXRlVmFsdWUgPSBwb3B1cEVkaXRXaW5kb3cucXVlcnlTZWxlY3RvcihcIi5mdWxsX2Rlc2NyaXB0aW9uXCIpLnZhbHVlO1xyXG5cclxuICAgICAgICAgICAgICAgIGlmKHRpdGxlVXBkYXRlVmFsdWUgPT0gJycpe1xyXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlVXBkYXRlLnBsYWNlaG9sZGVyID0gJ1RpdGxlIHNob3VsZCBub3QgYmUgZW1wdHkhJztcclxuICAgICAgICAgICAgICAgICAgICB0aXRsZVVwZGF0ZS5jbGFzc0xpc3QuYWRkKCdjb2xvclBsYWNlaG9sZGVyJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpZihhdXRob3JVcGRhdGVWYWx1ZSA9PSAnJyl7XHJcbiAgICAgICAgICAgICAgICAgICAgYXV0aG9yVXBkYXRlLnBsYWNlaG9sZGVyID0gJ0F1dGhvciBzaG91bGQgbm90IGJlIGVtcHR5ISc7XHJcbiAgICAgICAgICAgICAgICAgICAgYXV0aG9yVXBkYXRlLmNsYXNzTGlzdC5hZGQoJ2NvbG9yUGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBpZihkZXNjcmlwdGlvblVwZGF0ZVZhbHVlID09ICcnKXtcclxuICAgICAgICAgICAgICAgICAgICBkZXNjcmlwdGlvblVwZGF0ZS5wbGFjZWhvbGRlciA9ICdTaG9ydCBEZXNjcmlwdGlvbiBzaG91bGQgbm90IGJlIGVtcHR5ISc7XHJcbiAgICAgICAgICAgICAgICAgICAgZGVzY3JpcHRpb25VcGRhdGUuY2xhc3NMaXN0LmFkZCgnY29sb3JQbGFjZWhvbGRlcicpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGlmKG1lc3NhZ2VVcGRhdGVWYWx1ZSA9PSAnJyl7XHJcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZVVwZGF0ZS5wbGFjZWhvbGRlciA9ICdNZXNzYWdlIGZpZWxkIHNob3VsZCBub3QgYmUgZW1wdHkhJztcclxuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlVXBkYXRlLmNsYXNzTGlzdC5hZGQoJ2NvbG9yUGxhY2Vob2xkZXInKTtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICBlbHNlIGlmKHRpdGxlVXBkYXRlVmFsdWUgIT0gJycgJiYgYXV0aG9yVXBkYXRlVmFsdWUgIT0gJycgJiYgZGVzY3JpcHRpb25VcGRhdGVWYWx1ZSAhPSAnJyAmJiBtZXNzYWdlVXBkYXRlVmFsdWUgIT0gJycpe1xyXG4gICAgICAgICAgICAgICAgICAgIGxldCBkYXRhQXJyID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcInVwZGF0ZUluZm9CdG5cIjogZS50YXJnZXQsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibWVzc2FnZVVwZGF0ZUlEXCI6IGAke2lkVXBkYXRlRmllbGQudmFsdWV9YCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ1cGRhdGVJbmZvXCI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwidGl0bGVVcGRhdGVcIjogdGl0bGVVcGRhdGVWYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhdXRob3JVcGRhdGVcIjogYXV0aG9yVXBkYXRlVmFsdWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZGVzY3JpcHRpb25VcGRhdGVcIjogZGVzY3JpcHRpb25VcGRhdGVWYWx1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJtZXNzYWdlVXBkYXRlXCI6IG1lc3NhZ2VVcGRhdGVWYWx1ZVxyXG4gICAgICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICAgICAgYm9keVNjcm9sbGluZ1RvZ2dsZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFqYXgoJ2VkaXRNZXNzYWdlLnBocCcsICdwb3N0JywgdXBkYXRlTWVzc2FnZSwgZGF0YUFycik7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfSk7XHJcblxyXG5cclxuICAgICAgICBjbG9zZUNvbW1lbnRXaW5kb3dCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgcG9wdXBDb21tZW50V2luZG93LmNsYXNzTGlzdC5yZW1vdmUoXCJvcGVuXCIpO1xyXG4gICAgICAgICAgICBib2R5U2Nyb2xsaW5nVG9nZ2xlKCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNsb3NlRWRpdFdpbmRvd0J0bi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBwb3B1cEVkaXRXaW5kb3cuY2xhc3NMaXN0LnJlbW92ZShcIm9wZW5cIik7XHJcbiAgICAgICAgICAgIGJvZHlTY3JvbGxpbmdUb2dnbGUoKTtcclxuICAgICAgICB9KTtcclxuXHJcblxyXG5cclxuICAgIH07XHJcbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLWluc2VydENvbW1lbnRzLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG5cclxuICAgIGZ1bmN0aW9uIGluc2VydENvbW1lbnRzKGRhdGFBdHJyKSB7XHJcbiAgICAgICAgcG9wdXBDb21tZW50V2luZG93LmNsYXNzTGlzdC5yZW1vdmUoXCJvcGVuXCIpO1xyXG4gICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1zaG93Q29tbWVudHMtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuICAgIGZ1bmN0aW9uIHNob3dDb21tZW50cyhkYXRhQXRycikge1xyXG5cclxuICAgICAgICBsZXQgcmVzcG9uc2UgPSBKU09OLnBhcnNlKGRhdGFBdHJyLnJlc3BvbnNlKTtcclxuICAgICAgICBjb21tZW50c0Jsb2NrLmlubmVySFRNTCA9IFwiXCI7XHJcblxyXG4gICAgICAgIGlmIChyZXNwb25zZS5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHJlc3BvbnNlLmZvckVhY2goKGtleSwgdmFsdWUpID0+IHtcclxuICAgICAgICAgICAgICAgIGxldCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgICAgIHJvdy5jbGFzc0xpc3QuYWRkKCdwb3N0ZWRDb21tZW50Jyk7XHJcbiAgICAgICAgICAgICAgICByb3cuaW5uZXJIVE1MID0gJ1wiJyArIGtleS5jb21tZW50VGV4dCArICdcIicgKyBcIiBwb3N0ZWQgYnkgXCIgKyBrZXkuY29tbWVudGF0b3I7XHJcbiAgICAgICAgICAgICAgICBjb21tZW50c0Jsb2NrLmFwcGVuZChyb3cpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIGxldCByb3cgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgcm93LmlubmVySFRNTCA9IFwiTm8gY29tbWVudHMgeWV0XCI7XHJcbiAgICAgICAgICAgIGNvbW1lbnRzQmxvY2suYXBwZW5kKHJvdyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tZWRpdE1lc3NhZ2UtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0vL1xyXG5cclxuICAgIGZ1bmN0aW9uIGVkaXRNZXNzYWdlKGRhdGFBdHJyKSB7XHJcblxyXG4gICAgICAgIGxldCByZXNwb25zZSA9IEpTT04ucGFyc2UoZGF0YUF0cnIucmVzcG9uc2UpO1xyXG4gICAgICAgIHBvcHVwRWRpdFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLnRpdGxlXCIpLnZhbHVlID0gcmVzcG9uc2VbMF0udGl0bGU7XHJcbiAgICAgICAgcG9wdXBFZGl0V2luZG93LnF1ZXJ5U2VsZWN0b3IoXCIuYXV0aG9yXCIpLnZhbHVlID0gcmVzcG9uc2VbMF0uYXV0aG9yO1xyXG4gICAgICAgIHBvcHVwRWRpdFdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLnNob3J0X2Rlc2NyaXB0aW9uXCIpLnZhbHVlID0gcmVzcG9uc2VbMF0uZGVzY3JpcHRpb247XHJcbiAgICAgICAgcG9wdXBFZGl0V2luZG93LnF1ZXJ5U2VsZWN0b3IoXCIuZnVsbF9kZXNjcmlwdGlvblwiKS52YWx1ZSA9IHJlc3BvbnNlWzBdLm1lc3NhZ2U7XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB1cGRhdGVNZXNzYWdlKGRhdGFBdHJyKSB7XHJcblxyXG4gICAgICAgIGxldCByZXNwb25zZSA9IGRhdGFBdHJyLnJlc3BvbnNlO1xyXG4gICAgICAgIHBvcHVwRWRpdFdpbmRvdy5jbGFzc0xpc3QucmVtb3ZlKCdvcGVuJyk7XHJcbiAgICAgICAgbG9jYXRpb24ucmVsb2FkKCk7XHJcblxyXG5cclxuICAgIH1cclxuXHJcbiAgICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tUGFnaW5hdGlvbi0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS8vXHJcblxyXG4gICAgY29uc3QgbWVzc2FnZXNMaXN0ID0gbWFpblNlY3Rpb247XHJcbiAgICBjb25zdCBwYWdlTnVtYmVycyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIjcGFnaW5hdGlvblwiKTtcclxuICAgIGxldCBjdXJyZW50UGFnZSA9IDEsXHJcbiAgICAgICAgcm93cyA9IDI7XHJcblxyXG5cclxuICAgIGNvbnN0IGRpc3BsYXlMaXN0ID0gKGl0ZW1zLCB3cmFwcGVyLCByb3dzUGVyUGFnZSwgcGFnZSkgPT4ge1xyXG4gICAgICAgIHdyYXBwZXIuaW5uZXJIVE1MID0gXCJcIjtcclxuICAgICAgICBwYWdlLS07XHJcblxyXG4gICAgICAgIGxldCBzdGFydCA9IHJvd3NQZXJQYWdlICogcGFnZTtcclxuICAgICAgICBsZXQgZW5kID0gc3RhcnQgKyByb3dzUGVyUGFnZTtcclxuICAgICAgICBsZXQgcGFnaW5hdGVkSXRlbXMgPSBpdGVtcy5zbGljZShzdGFydCwgZW5kKTtcclxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHBhZ2luYXRlZEl0ZW1zLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIGxldCBpdGVtID0gcGFnaW5hdGVkSXRlbXNbaV07XHJcbiAgICAgICAgICAgIGxldCBpdGVtRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICBpdGVtRWxlbWVudC5jbGFzc0xpc3QuYWRkKCdpdGVtJyk7XHJcbiAgICAgICAgICAgIGl0ZW1FbGVtZW50LmFwcGVuZChpdGVtKTtcclxuICAgICAgICAgICAgbWFpblNlY3Rpb24uYXBwZW5kQ2hpbGQoaXRlbUVsZW1lbnQpO1xyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IHNldHVwUGFnaW5hdGlvbiA9IChpdGVtcywgd3JhcHBlciwgcm93c1BlclBhZ2UpID0+IHtcclxuICAgICAgICB3cmFwcGVyLmlubmVySFRNTCA9IFwiXCI7XHJcblxyXG4gICAgICAgIGxldCBwYWdlQ291bnQgPSBNYXRoLmNlaWwoaXRlbXMubGVuZ3RoIC8gcm93c1BlclBhZ2UpO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHBhZ2VDb3VudCArIDE7IGkrKykge1xyXG4gICAgICAgICAgICBsZXQgYnRuID0gcGFnaW5hdGlvbkJ1dHRvbihpLCBpdGVtcyk7XHJcbiAgICAgICAgICAgIHdyYXBwZXIuYXBwZW5kQ2hpbGQoYnRuKTtcclxuICAgICAgICB9XHJcblxyXG5cclxuICAgIH07XHJcblxyXG4gICAgY29uc3QgcGFnaW5hdGlvbkJ1dHRvbiA9IChwYWdlLCBpdGVtcykgPT4ge1xyXG4gICAgICAgIGxldCBidXR0b24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdidXR0b24nKTtcclxuICAgICAgICBidXR0b24uaW5uZXJUZXh0ID0gcGFnZTtcclxuXHJcbiAgICAgICAgaWYoY3VycmVudFBhZ2UgPT0gcGFnZSkgYnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xyXG5cclxuICAgICAgICBidXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKT0+e1xyXG4gICAgICAgICAgICBjdXJyZW50UGFnZSA9IHBhZ2U7XHJcbiAgICAgICAgICAgIGRpc3BsYXlMaXN0KGl0ZW1zLCBtZXNzYWdlc0xpc3QsIHJvd3MsIGN1cnJlbnRQYWdlKTtcclxuXHJcbiAgICAgICAgICAgIGxldCBjdXJyZW50QnRuID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLnBhZ2VudW1iZXJzIGJ1dHRvbi5hY3RpdmUnKTtcclxuICAgICAgICAgICAgY3VycmVudEJ0bi5jbGFzc0xpc3QucmVtb3ZlKCdhY3RpdmUnKTtcclxuXHJcbiAgICAgICAgICAgIGJ1dHRvbi5jbGFzc0xpc3QuYWRkKCdhY3RpdmUnKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGJ1dHRvbjtcclxuICAgIH1cclxuXHJcblxyXG59XHJcblxyXG5cclxuXHJcbiIsIi8qKlxyXG4gKiBDcmVhdGVkIGJ5IFVzZXIgb24gMDI0IDI0LjEwLjIxLlxyXG4gKi9cclxuXHJcbmV4cG9ydCBkZWZhdWx0ICgpID0+IHtcclxuXHJcbiAgICBjb25zdCBib2R5U2Nyb2xsaW5nVG9nZ2xlID0gKCkgPT4ge1xyXG4gICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnRvZ2dsZShcInN0b3Atc2Nyb2xsaW5nXCIpO1xyXG4gICAgfVxyXG5cclxuXHJcbiAgICAoKCkgPT4ge1xyXG4gICAgICAgIGNvbnN0IG1lc3NhZ2VQb3N0ID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihcIi5tZXNzYWdlUG9zdFwiKSxcclxuICAgICAgICAgICAgbWVzc2FnZVdpbmRvdyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIucG9wdXAtZm9ybVwiKSxcclxuICAgICAgICAgICAgY2xvc2VNZXNzYWdlV2luZG93QnRuID0gbWVzc2FnZVdpbmRvdy5xdWVyeVNlbGVjdG9yKFwiLmNsb3NlLWZvcm0tbWVudVwiKTtcclxuXHJcblxyXG5cclxuICAgICAgICBjb25zdCBmYWRlT3V0RWZmZWN0ID0gKCkgPT4ge1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZmFkZS1vdXQtZWZmZWN0XCIpLmNsYXNzTGlzdC5yZW1vdmUoXCJhY3RpdmVcIik7XHJcbiAgICAgICAgICAgIH0sIDMwMCk7XHJcbiAgICAgICAgICAgIGBgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBtZXNzYWdlUG9zdC5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKCkgPT4ge1xyXG4gICAgICAgICAgICBtZXNzYWdlV2luZG93LmNsYXNzTGlzdC5hZGQoXCJvcGVuXCIpO1xyXG4gICAgICAgICAgICBtZXNzYWdlV2luZG93LnJlc2V0KCk7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCIuZmFkZS1vdXQtZWZmZWN0XCIpLmNsYXNzTGlzdC5hZGQoXCJhY3RpdmVcIik7XHJcbiAgICAgICAgICAgIGJvZHlTY3JvbGxpbmdUb2dnbGUoKTtcclxuICAgICAgICB9KTtcclxuXHJcblxyXG5cclxuICAgICAgICBjbG9zZU1lc3NhZ2VXaW5kb3dCdG4uYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsICgpID0+IHtcclxuICAgICAgICAgICAgbWVzc2FnZVdpbmRvdy5jbGFzc0xpc3QucmVtb3ZlKFwib3BlblwiKTtcclxuICAgICAgICAgICAgYm9keVNjcm9sbGluZ1RvZ2dsZSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuXHJcblxyXG4gICAgfSkoKTtcclxuXHJcblxyXG59XHJcbiJdfQ==
