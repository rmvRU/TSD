'use strict';

(function () {
    var app = {
        data: {}
    };

    var bootstrap = function () {
        $(function () {

            var s = window.localStorage;
            app.service_url = (s.getItem("service-url") != null) ? s.getItem("service-url") : "http://10.8.1.68:8904/";


            app.mobileApp = new kendo.mobile.Application(document.body, {
                skin: 'nova',
                initial: 'components/authenticationView/view.html'
            });
        });
    };

    if (window.cordova) {
        document.addEventListener('deviceready', function () {
            if (navigator && navigator.splashscreen) {
                navigator.splashscreen.hide();
            }

            var element = document.getElementById('appDrawer');
            if (typeof (element) != 'undefined' && element !== null) {
                if (window.navigator.msPointerEnabled) {
                    $('#navigation-container').on('MSPointerDown', 'a', function (event) {
                        app.keepActiveState($(this));
                    });
                } else {
                    $('#navigation-container').on('touchstart', 'a', function (event) {
                        app.keepActiveState($(this).closest('li'));
                    });
                }
            }

            bootstrap();
        }, false);
    } else {
        bootstrap();
    }

    app.keepActiveState = function _keepActiveState(item) {
        var currentItem = item;
        $('#navigation-container li.active').removeClass('active');
        currentItem.addClass('active');
    };

    window.app = app;




    app.isOnline = function () {
        if (!navigator || !navigator.connection) {
            return true;
        } else {
            return navigator.connection.type !== 'none';
        }
    };


    app.openLink = function (url) {
        if (url.substring(0, 4) === 'geo:' && device.platform === 'iOS') {
            url = 'http://maps.apple.com/?ll=' + url.substring(4, url.length);
        }

        window.open(url, '_system');
        if (window.event) {
            window.event.preventDefault && window.event.preventDefault();
            window.event.returnValue = false;
        }
    };

    // start kendo binders
    // end kendo binders
    app.showFileUploadName = function (itemViewName) {
        $('.' + itemViewName).off('change', 'input[type=\'file\']').on('change', 'input[type=\'file\']', function (event) {
            var target = $(event.target),
                inputValue = target.val(),
                fileName = inputValue.substring(inputValue.lastIndexOf('\\') + 1, inputValue.length);

            $('#' + target.attr('id') + 'Name').text(fileName);
        });

    };

    app.clearFormDomData = function (formType) {
        $.each($('.' + formType).find('input:not([data-bind]), textarea:not([data-bind])'), function (key, value) {
            var domEl = $(value),
                inputType = domEl.attr('type');

            if (domEl.val().length) {

                if (inputType === 'file') {
                    $('#' + domEl.attr('id') + 'Name').text('');
                }

                domEl.val('');
            }
        });
    };

}());

// START_CUSTOM_CODE_kendoUiMobileApp
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes
app.getUser = function (login, password) {
    var url = '/login.asp?login=' + login + '&password=' + password;
    var d = new DataTable;
    d.getData(url);
    return d
};



app.UserInfoViewModel = kendo.observable({
    name: '',
    login: '',
    password: '',
    errorMessage: '',
    validateData: function (data) {
        var model = authenticationViewModel;

        if (!data.email) {
            model.set('errorMessage', 'Введите логин');
            return false;
        }


        return true;
    },
    signin: function () {
        alert("zuzu");
        if (!parent.authenticationViewModel.validateData(parent.authenticationViewModel)) return;
        var d = app.getUser(this.name, this.login);
        alert(d.length);
    },

    register: function () {},
    toggleView: function () {
        var model = authenticationViewModel;
        model.set('errorMessage', '');

        mode = mode === 'signin' ? 'register' : 'signin';

        init();
    }
});



// END_CUSTOM_CODE_kendoUiMobileApp