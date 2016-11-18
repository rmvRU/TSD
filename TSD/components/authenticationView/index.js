'use strict';

app.authenticationView = kendo.observable({
    onShow: function () {},
    afterShow: function () {}
});

// START_CUSTOM_CODE_authenticationView
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_authenticationView
(function (parent) {
    var
        authenticationViewModel = kendo.observable({
            displayName: '',
            email: '',
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
                if (!parent.authenticationViewModel.validateData(parent.authenticationViewModel)) return;
                alert("OK");


            },

            register: function () {},
            toggleView: function () {
                var model = authenticationViewModel;
                model.set('errorMessage', '');

                mode = mode === 'signin' ? 'register' : 'signin';

                init();
            }
        });

    parent.set('authenticationViewModel', authenticationViewModel);
    parent.set('afterShow', function (e) {
        if (e && e.view && e.view.params && e.view.params.logout) {
            authenticationViewModel.set('logout', true);
        }
    });
})(app.authenticationView);

// START_CUSTOM_CODE_authenticationViewModel
// Add custom code here. For more information about custom code, see http://docs.telerik.com/platform/screenbuilder/troubleshooting/how-to-keep-custom-code-changes

// END_CUSTOM_CODE_authenticationViewModel