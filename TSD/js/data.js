function DataTable() {
    this.lines = [];
    this.url = '';
    this.serverFilters = [];
    this.filters = [];
    this.async = false;
    currentIndex = 0;
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
        //$(this).trigger('beforeLoading');	
        request.done(function (data) {
            //if (self.testMode==true) alert(data);;//!!!
            if (checkForErrors(data) == true)
                self.getDataSuccess = self.serialize(data);
            else
                self.getDataSuccess = false;
            //$(self).trigger('afterLoading');
        });
        request.fail(function (data) {
            self.lastError = "error on loading resource " + url;
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
        rows = $(data).find('row');
        for (var i = 0; i < rows.length; i++) {
            this.lines.push(new this.serializeRow(rows[i]));
        }
        $(this).trigger('onSerializable');
        //alert('rows ' + rows.length + ' lines ' + this.lines.length);
        return true;
    };
    this.serializeRow = function (row) {
        for (var j = 0; j < row.attributes.length; j++) {
            var attr = row.attributes[j];
            this[attr.name] = attr.value;
        }
        return (this);
    }
    this.next = function (step) {};
}