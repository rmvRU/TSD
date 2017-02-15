'use strict';


function _getArgs(func) {
    // First match everything inside the function argument parens.
    var args = func.toString().match(/function\s.*?\(([^)]*)\)/)[1];

    // Split the arguments string into an array comma delimited.
    return args.split(',').map(function (arg) {
        // Ensure no inline comments are parsed and trim the whitespace.
        return arg.replace(/\/\*.*\*\//, '').trim();
    }).filter(function (arg) {
        // Ensure no undefined values are added.
        return arg;
    });
};



function PmTask() {
    app.resource = "RES000183";
    this.connector = new _connector(app.service_url, this);
    var params = [
        { name: "resource", type: "c", value: app.resource }
    ];
    this.cancel_reasons = this.connector.execute_sp('pm_tsd_GetReasons', params, true);
    console.log(this.cancel_reasons);
    this.pm_getTasks = function (barcode, current_bin) {
        var params = [
            { name: "resource", type: "c", value: app.resource }
        ];
        var names = _getArgs(this.pm_getTasks);
        for (var i = 0; i < arguments.length; i++) {
            var a = arguments[i];
            params.push(new _sql_param(names[i], 'c', a));
        }

        this.data = this.connector.execute_sp('pm_tsd_GetTasks', params, true);
        this.lines = this.data.lines;
        this.list_lines = new $(this.lines).filter(function (index) { return (this.exec_status == 1 && index < 50) });
        this.assign_lines = new $(this.lines).filter(function (index) { return (this.exec_status == 2) });
        this.basket_lines = new $(this.lines).filter(function (index) { return (this.exec_status == 3) });
        this.unavailable_lines = new $(this.lines).filter(function (index) { return (this.exec_status == 0) });
        $(this).trigger('OnLoad');
    };
    this.pm_line_ChangeStatus = function (line, new_status) {
        if (typeof (line.to_psn) == 'undefined') { line.to_psn = '' };
        if (typeof (line.to_bin) == 'undefined') { line.to_bin = '' };
        if (typeof (line.confirm_barcode) == 'undefined') { line.confirm_barcode = '' };
        if (typeof (line.cancel_reason) == 'undefined') { line.cancel_reason = '' };
        var params = [
            { name: "resourceNo", type: "c", value: app.resource }
            , { name: "entry_no", type: "i", value: line.entry_no }
            , { name: "new_status", type: "i", value: new_status }
            , { name: "to_bin", type: "c", value: line.to_bin }
            , { name: "to_psn", type: "c", value: line.to_psn }
            , { name: "confirm_barcode", type: "c", value: line.confirm_barcode }
            , { name: "cancel_reason", type: "c", value: line.cancel_reason }
        ];
        var retVal = this.connector.execute_sp('pm_line_ChangeStatus', params, false);
        return (retVal);
    };
}


function sql_common() {
    this.connector = new _connector(app.service_url, this);
    this.op_barcodeInfo = function (barcode) {
        var params = [
            { name: "resourceNo", type: "c", value: app.resource }
            , { name: "barcode", type: "c", value: barcode }]
        return this.connector.execute_sp('op_barcodeInfo', params, true);
    };

    this.pm_tsd_GetBins_ByMask = function (mask) {
        var params = [
            { name: "resource", type: "c", value: app.resource }
            , { name: "mask", type: "c", value: mask }]
        return this.connector.execute_sp('pm_tsd_GetBins_ByMask', params, true);
    };
};



function hackedLogin(url) {
    var c = new _connector(url);
    /*
    var d = c._execute_sp('op_tsd_getUserInfo'
        , [{ name: "login", type: "c", value: "0183" }
            , { name: "password", type: "c", value: "" }
        ], true
    )
    */
    url += '/login.asp?login=0183';
    var d = c._getData(url, true);
    return d.lines;
}

function _sql_param(name, type, value) {
    this.name = name;
    this.value = value;
    this.type = type;
    return this
}

function _connector(url, parent) {
    this.url = url;
    this.parent = parent;
    this.open_rs = function (query) {
        alert('not released');
    };
    this.execute_sp = function (name, params, getData) {
        app.disableInput(true);
        var url = this.url;
        url += '/sql_wrapper.asp?__sp=' + name;
        for (var i = 0; i < params.length; i++) {
            url += '&_' + params[i].type + params[i].name + '=' + params[i].value;
        };
        console.log(url);
        if (getData) {
            app.disableInput(false);
            return this._getData(url);
        }
        else {
            try {
                app.disableInput(false);
                return this._runCommand(url);
            }
            catch (err) {
                app.disableInput(false);
                alert(err.message)
            }
        }
    };

    this._runCommand = function (url) {
        var self = this;
        var request = $.ajax({ type: 'POST', url: url, async: false });
        request.done(function (data) {
            self.returnedData = data;
            self.updateResult = self.processUpdateResults(data);
        });
        request.fail(function (data) {
            self.returnedData = data;
            self.lastError = "error on loading resource " + url;
            self.updateResult = false;
        });
        if (!this.updateResult) {
            $(this.parent).trigger('OnError', this.lastError);
        }
        return this.updateResult;
    };
    this._getData = function (url) {
        console.log(url);
        var d = new DataTable();
        d.getData(url);
        return d;
    };

    this.processUpdateResults = function (data) {
        var errors = $("errors", data);
        if (errors.length != 0) {
            var error = $("error", errors);
            var error_text = '';
            for (var i = 0; i < error.length; i++) {
                error_text += $(error[i]).attr("description");
                error_text += '<br/>' + $(error[i]).attr("sql");

            }
            this.lastError = error_text;
            return false;
        }
        return true;

    };
    return this;
}



function DataTable() {
    this.lines = [];
    this.url = '';
    this.serverFilters = [];
    this.filters = [];
    this.async = false;
    this.currentIndex = 0;
    this.clearFilters = function () {
        this.lines.length = 0;
        this.serverFilters.length = 0;
        this.filters.length = 0;
    };

    this.setFilter = function (table, field, value) {
        //if (value=='') value='""';
        var expValues = '><=';
        if (expValues.indexOf(value[0]) == -1 && value != '') {
            value = '==' + value;
        }
        var f = new filter(field, value);
        this.filters.push(f);
        var self = this;
        self.filterValue = value;
        self.filterField = field;
        current_lines = new $(table).filter(function (index) {
            if (self.filterValue == '') return (this[self.filterField] == '');
            //alert(eval(this[self.filterField]+self.filterValue));
            return (eval(this[self.filterField] + self.filterValue));
        });
        //alert(current_lines.length);
        return (current_lines);
    };
    this.copyFilters = function (fromFilters) {
        for (var i = 0; i < fromFilters.length; i++) {
            this.lines = this.setFilter(this.lines, fromFilters[i].field, fromFilters[i].value);
        }
    }

    this.copyFiltersServer = function (fromFilters) {
        for (var i = 0; i < fromFilters.length; i++) {
            this.setFilterServer(this.lines, fromFilters[i].field, fromFilters[i].value);
        }
    }


    this.setFilterServer = function (field, value) {
        for (var i = 0; i < this.serverFilters.length; i++) {
            if (this.serverFilters[i].field == field) {
                this.serverFilters[i].value = value;
                return;
            }
        }
        var f = new filter(field, value);
        this.serverFilters.push(f);
    };

    function filter(field, value) {
        this.field = field;
        this.value = value;
        return this;

    }

    this.getData = function (url) {
        this.url = url;
        var xml = '';
        for (var i = 0; i < this.serverFilters.length; i++) {
            xml += '<filter><field>' + this.serverFilters[i].field + '</field><value>' + this.serverFilters[i].value + '</value></filter>'
        };
        xml = '<root>' + xml + '</root>';
        var url = this.url;
        var request = $.ajax({
            type: 'POST',
            url: url,
            data: xml,
            async: this.async
        });
        var self = this;
        this.getDataSuccess = false;
        //alert(url);
        //$(this).trigger('beforeLoading');	
        request.done(function (data) {
            //console.dir(data);
            //if (self.testMode==true) alert(data);;//!!!
            if (checkForErrors(data) == true)
                self.getDataSuccess = self.serialize(data);
            else
                self.getDataSuccess = false;
            //$(self).trigger('afterLoading');
        });
        request.fail(function (data) {
            //console.dir(data);
            self.lastError = "error on loading resource " + url;
            console.log(self.lastError)
            $(self).trigger('onError');
            self.getDataSuccess = false;

        });
        return (this.getDataSuccess);
    };

    function checkForErrors(data) {
        var errors = $("errors", data);
        if (errors.length != 0) {
            var error = $("error", errors);
            var error_text = '';
            for (var i = 0; i < error.length; i++) {
                error_text += $(error[i]).attr("description");
                error_text += '<br/>' + $(error[i]).attr("sql");
            }
            this.lastError = error_text;
            $(this).trigger('onError');
            return false;
        }
        return true;

    }

    this.serialize = function (data) {
        this.lines.length = 0;
        var rows = $(data).find('row');
        for (var i = 0; i < rows.length; i++) {
            this.lines.push(new this.serializeRow(rows[i], i));
        }
        $(this).trigger('onSerializable');
        //alert('rows ' + rows.length + ' lines ' + this.lines.length);
        return true;
    };
    this.serializeRow = function (row, idx) {
        for (var j = 0; j < row.attributes.length; j++) {
            var attr = row.attributes[j];
            this[attr.name] = attr.value;
        }
        this.idx=idx;
        return (this);
    }
    this.next = function (step) { };
}