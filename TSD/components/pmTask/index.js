'use strict';
app.pmTask = new PmTask();

app.pmTask.switchView = function (index) {
    app.pmTask.tabstripIndex = index;
    switch (index) {
        case 0: {
            app.pmTask.dataSource = new kendo.data.DataSource({ data: app.pmTask.list_lines });
            break;
        };
        case 1: {
            app.pmTask.dataSource = new kendo.data.DataSource({ data: app.pmTask.assign_lines });
            break;
        };
        case 2: {
            app.pmTask.dataSource = new kendo.data.DataSource({ data: app.pmTask.basket_lines });
            break;
        };
        case 3: {
            app.pmTask.dataSource = new kendo.data.DataSource({ data: app.pmTask.unavailable_lines });
            break;
        };
    };
    app.pmTask.listView.setDataSource(app.pmTask.dataSource);
    app.pmTask.listView.refresh();

    app.pmTask.tabstrip.badge(1, false);
    app.pmTask.tabstrip.badge(2, false);
    app.pmTask.tabstrip.badge(3, false);


    app.pmTask.tabstrip.badge(0, app.pmTask.list_lines.length);
    if (app.pmTask.assign_lines.length != 0) app.pmTask.tabstrip.badge(1, app.pmTask.assign_lines.length);
    if (app.pmTask.basket_lines.length != 0) app.pmTask.tabstrip.badge(2, app.pmTask.basket_lines.length);
    if (app.pmTask.unavailable_lines.length != 0) app.pmTask.tabstrip.badge(3, app.pmTask.unavailable_lines.length);

};

function onSelect(e) {
    app.pmTask.switchView($(e.item).index());
};

$(app.pmTask).bind("OnError", function (o, errorText) {
    alert("Ошибка при отправке данных на сервер:" + errorText);
});

$(app.pmTask).bind("OnLoad", function (o, errorText) {
    app.pmTask.switchView(app.pmTask.tabstripIndex);
});



var d_def = [{
    type: 'input', field: 'barcode', caption: 'Сканируй ШК  ', completedCaption: '#:barcode# отсканирован'
    , confirmType: 'scan_bin'
    , onValidate: function (value) {
        app.pmTask.pm_getTasks(value);
        switch (app.pmTask.lines.length) {
            case 0:
                //alert("You scanned " + value + ".Barcode Info not Released");
                app.showBarcodeInfo(value);
                break;
            case 1:
                app.pmTask.current_rec = app.pmTask.lines[0];
                if (app.pmTask.current_rec.psn == '' || value != app.pmTask.current_rec.psn) {
                    app.dialog.switchTo(1, app.pmTask.current_rec);
                }
                else {
                    if (app.pmTask.pm_line_ChangeStatus(app.pmTask.current_rec, 3)) {
                        app.pmTask.pm_getTasks(value);
                        app.pmTask.tabstrip.switchTo(2);
                        app.pmTask.switchView(2);
                        app.dialog.switchTo(2, app.pmTask.current_rec);
                    };
                };
                break;
            default:
                //error = 'Найдено несколько строк заданий. Сканируйте ШК паллета';
                dataSource.data(app.pmTask.lines);

                break;
        };
    }
}
    , {
    type: 'input', field: 'confirm_barcode', caption: 'Подтверждение - сканируй ШК ГМ', completedCaption: '#:barcode# отсканирован', confirmType: 'scan'
    , onValidate: function (value) {
        app.pmTask.current_rec.confirm_barcode = value;
        if (app.pmTask.pm_line_ChangeStatus(app.pmTask.current_rec, 3)) {
            app.pmTask.pm_getTasks();
            app.pmTask.tabstrip.switchTo(2);
            app.pmTask.switchView(2);
            app.dialog.switchTo(2, app.pmTask.current_rec);
        }
        else
            app.dialog.reRun();
    }
}
    , {
    type: 'input', field: 'to_bin', caption: 'В зону #:to_zone_desc#', completedCaption: 'Размещено в ячейку #:to_bin#', errorCaption: '', confirmType: 'scan_bin'
    , onValidate: function (value) {
        var error = ''
        app.pmTask.current_rec.to_bin = value;
        //проверка - есть ли еще товар в ячейке и нужно ли подтверждать сканированием ГМ
        var d = app.sql_common.op_barcodeInfo(value);
        var bin = new $(d.lines).filter(function (index) { return (this.type == 'bin_info') });
        if (bin.length == 0) {
            error = 'Ячейки ' + value + ' не существует'
            $(app.pmTask).trigger('OnError', error);
            return;
        };
        //если емкость в стандартных ГМ небольшая и есть данные в географии и запускаем подтверждение
        app.geo_buffer = new $(d.lines).filter(function (index) { return (this.type == 'geo_info') });
        if (parseInt(bin[0].bin_capacity_in_psn) < 1000 && app.geo_buffer.length != 0) {
            //запускаем подтверждение и выходим
            app.dialog.switchTo(3, app.pmTask.current_rec);
            return;
        };
        var retVal = app.pmTask.pm_line_ChangeStatus(app.pmTask.current_rec, 55);
        if (retVal) {
            app.dialog.switchTo(0);
        }

    }
}
    , {
    type: 'input', field: 'check_psn', caption: 'В ячейке #:to_bin# уже есть товар. Отсканируйте любое ГМ из ячейки', completedCaption: 'Подтверждено', errorCaption: '', confirmType: 'scan'
    , onValidate: function (value) {
        var error = ''
        var geo_index = -1;
        for (var i = 0; i < app.geo_buffer.length; i++) {
            if (app.geo_buffer[i].psn == value) {
                geo_index = i;
            }
        };
        if (geo_index == -1) {
            error = 'ГМ ' + value + ' в ячейке не числится';
            $(app.pmTask).trigger('OnError', error);
            app.dialog.switchTo(2);
            return;
        };
        var retVal = app.pmTask.pm_line_ChangeStatus(app.pmTask.current_rec, 4);
        if (retVal) {
            app.dialog.switchTo(0);
        };
        return error
    }
}

];

function show(e) {
    app.pmTask.tabstrip = $("#tabstrip").data("kendoMobileTabStrip");
    app.pmTask.listView = $("#list").data("kendoMobileListView");
    app.pmTask.tabstripIndex = 0;
    app.pmTask.pm_getTasks();



    app.pmTask.container = "#dialog_Container";
    //alert(document.getElementById("dialog_Container").innerHTML);
    var d = new Dialog(d_def);
    d.setDefaultTemplate('#dialog_Container_Template');
    d.runDialog(app.pmTask.container, 0);
}

function list_showActions(e) {
    //$(document).scannerDetection('zuzuzu');
    console.log($(this).data('idx'));
    e.preventDefault();
    var i = $(e.item).index();
    var d = app.pmTask.dataSource;
    var rec = d.at(i);
    var ag = [];
    console.log(rec);
    switch (rec.exec_status) {
        case "0": {
            var a = {};
            a.caption = 'Вернуть в работу';
            a.handlingArguments = [];
            a.handlingArguments.push(rec);
            a.handlingFunction = function (line) {
                if (confirm('Вернуть в работу?')) {
                    if (app.pmTask.pm_line_ChangeStatus(line, 1)) {
                        app.pmTask.pm_getTasks();
                        app.pmTask.tabstrip.switchTo(0);
                        app.pmTask.switchView(0);
                        app.dialog.switchTo(0, app.pmTask.current_rec);
                    };

                };
            };
            ag.push(a);
            choose_Action('Выберите действие', ag);
            break;
          };
        case "1": {
            var cancel_reasons = app.pmTask.cancel_reasons.lines;
            for (var i = 0; i < cancel_reasons.length; i++) {
                var a = {};
                a.caption = cancel_reasons[i].description;
                a.handlingArguments = [];
                a.handlingArguments.push(rec);
                a.handlingArguments.push(cancel_reasons[i]);
                a.handlingFunction = function (line, cancel_reason) {
                    if (confirm('Отменить строку с кодом причины ' + cancel_reason.code + '?') == false) {
                        return (false);
                    };
                    line.cancel_reason = cancel_reason.code;
                    if (app.pmTask.pm_line_ChangeStatus(line, 5)) {
                        app.pmTask.pm_getTasks();
                        app.pmTask.tabstrip.switchTo(0);
                        app.pmTask.switchView(0);
                        app.dialog.switchTo(0, app.pmTask.current_rec);
                    };
                };
                ag.push(a);
            };
            choose_Action(rec.bin + '.Причина отмены', ag);
            break;
        };
        case "3": {
            var a = {};
            a.caption = 'Разместить';
            a.handlingArguments = [];
            a.handlingArguments.push(rec);
            a.handlingFunction = function (line) {
                app.dialog.switchTo(2, app.pmTask.current_rec);
            };

            var a = {};
            a.caption = 'Отменить взятие в работу';
            a.handlingArguments = [];
            a.handlingArguments.push(rec);
            a.handlingFunction = function (line) {
                if (confirm('Отменить взятие в работу?')) {
                    if (app.pmTask.pm_line_ChangeStatus(line, 1)) {
                        app.pmTask.pm_getTasks();
                        app.pmTask.tabstrip.switchTo(0);
                        app.pmTask.switchView(0);
                        app.dialog.switchTo(0, app.pmTask.current_rec);
                    };

                };
            };
            ag.push(a);
            choose_Action('Выберите действие', ag);
            break;
        };

        case "5": {

            break;
        };
    };
};

function choose_Action(title, ag) {
    app.ag = ag;
    var a = $("#userActions");
    var html = '<li class="km-actionsheet-title">' + title + '</li>';
    for (var i = 0; i < ag.length; i++) {
        html += '<li><a href="#" data-action="run_Action(' + i + ')" >' + ag[i].caption + '</li></a>';
    };
    a.data("kendoMobileActionSheet").destroy();
    a.html(html);
    kendo.init(a, kendo.mobile.ui);
    a.data("kendoMobileActionSheet").open();
};

function run_Action(i) {
    return function (e) {
        var a = app.ag[i];
        a.handlingFunction.apply(this, a.handlingArguments);
    };
}