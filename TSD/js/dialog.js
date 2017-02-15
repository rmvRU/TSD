'use strict';

function Dialog(data) {

    this.data = data;
    this.routines = data;
    this.runDialog = function (container, i, rec) {
        this.rec = rec;
        this.container = container;
        this.routineIndex = i;
        //если шаблон будем переопределять в настройках диалога - воткнуть сюда протяжку шаблона
        var t = kendo.template($(this.defaultTemplate).html());
        var ds = [];
        ds.push(this.data[i]);
        var di = ds[0];
        if (typeof (rec) != 'undefined') {
            //прогоняем макроподстановки
            for (var p in di) {
                if (typeof (di[p]) == 'string') {
                    di[p] = macroReplace(di[p], rec);
                }
            };
        };
        this.routine = di;
        var html = kendo.render(t, ds); //отрисовка с враппером формы
        $(container).html(html);
        app.dialog = this;
        //для сканирования включаем обработку
        app.onCompleteScan=function(value){
            app.dialog.processDialogInput(value);
        };
    };
    this.switchTo = function (r, rec) {
        //включить анализ индекс это или id
        this.runDialog(this.container, r, rec);
    };
    this.reRun = function () {
        this.runDialog(this.container, this.routeIndex, this.rec);
    };
    this.processDialogInput = function (obj) {
        var r = app.dialog.routines[app.dialog.routineIndex];
        if (typeof obj == 'string') {
            var value = obj;
        }
        else {
            var value = obj.value;
            obj.value = '';
        };
        switch (typeof (r.onValidate)) {
            case 'function': {
                var retVal = r.onValidate.apply(this, [value]);
            }
        }


    };
    this.setDefaultTemplate = function (t) {
        this.defaultTemplate = t;
    };
    return this;
}

function show_BinChoose(sender, value, handlingFunction) {
    var d = app.sql_common.pm_tsd_GetBins_ByMask(value);
    var b = d.lines;


};


function macroReplace(text, obj) {
    if (text == undefined) return text;
    console.dir(text);
    //alert(objToString(obj));
    for (var p in obj) {
        text = text.replace('#:' + p + '#', obj[p]);
    }
    return text;
}
