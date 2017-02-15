//rendering options
var fieldArray = [{
    field: 'bin', caption: 'Ячейка'
    , onClick: "show_barcodeInfo('%bin')"
}, { field: 'psn', caption: 'Место', onClick: "show_barcodeInfo('%psn')" }, { field: 'project', caption: 'Проект' }, { field: 'to_zone', caption: 'В Зону' }, { field: 'to_zone_desc', caption: 'Описание Зоны' }, { field: 'reason_code', caption: 'П' }];




//dialogs and action options
//Скан ШК
var pick2Handle_dialogArray =

    [
        {
            type: 'input', field: 'barcode', caption: 'Сканируй ШК  ', completedCaption: '%barcode отсканирован', confirmType: 'scan_bin'
            , template: '<h4><input id="dialog_%field"  onchange="processDialogInput(this);"></input>  %caption</h4>'
            , validationRules: [{
                required: true
                , canChangeValue: true
                , onValidate: function (rec, value, d) {
                    var url = '/getdata.asp?query=pm_getTasks&barcode=' + value;
                    pmTask.getData(url);
                    pmTask.url = '/getdata.asp?query=pm_getTasks';
                    var error = ''
                    switch (pmTask.lines.length) {
                        case 0:
                            show_barcodeInfo(value);
                            error = '';
                            break;
                        case 1:
                            this.current_rec = pmTask.lines[0];
                            var a = [];
                            a.push(this.current_rec);
                            if (this.current_rec.exec_status == 3) {
                                pmTask.switchView('basket');
                                pmTask.runAction(handleRoutine, a, pmTask.container, false);
                                break;
                            }
                            if (this.current_rec.psn == '' || value != this.current_rec.psn) {
                                pmTask.runAction(confirmBarcodeRoutine, a, pmTask.container, false);
                            }
                            else {
                                var retVal = pmTask.line_ChangeStatus(pmTask.activeRoutine.current_rec, 3);
                                if (retVal) {
                                    pmTask.load();
                                    pmTask.switchView('basket');
                                    //alert(objToString(this.current_rec));
                                    var a = [];
                                    a.push(this.current_rec);
                                    pmTask.runAction(handleRoutine, a, pmTask.container, false);
                                    //alert(objToString(this.current_rec));
                                }
                            };
                            //alert(objToString(this.current_rec));
                            break;
                        default:
                            error = 'Найдено несколько строк заданий. Сканируйте ШК паллета';
                            //return '';
                            break;

                    };
                    return error
                }
            }]
        }
    ];


if (typeof (pick2Handle_dialogOptions) == 'undefined') {
    pick2Handle_dialogOptions = [];
    pick2Handle_dialogOptions.options = [];
    pick2Handle_dialogOptions.sendXML = false;
    pick2Handle_dialogOptions.showLog = false;
};

var pick2handleRoutine = new tsdDialogRoutine(pick2Handle_dialogArray, pick2Handle_dialogOptions);
pick2handleRoutine.handlingFunction = function () {
    this.stopDialog = true;
    //alert('zuzu');
};


//Подтверждение скана ячейки сканированием содержимого
var confirmBarcode_dialogArray =

    [
        {
            type: 'input', field: 'confirm_barcode', caption: 'Подтверждение - сканируй ШК ГМ', completedCaption: '%barcode отсканирован', confirmType: 'scan'
            , template: '<h4><input id="dialog_%field"  onchange="processDialogInput(this);"></input>  %caption</h4>'
            , validationRules: [{
                required: true
                , canChangeValue: true
                , onValidate: function (rec, value, d) {
                    rec.confirm_barcode = value;
                    var a = [];
                    a.push(rec);
                    //alert(objToString(rec));
                    var retVal = pmTask.line_ChangeStatus(rec, 3);
                    if (retVal) {
                        pmTask.load();
                        pmTask.switchView('basket');
                        pmTask.runAction(handleRoutine, a, pmTask.container, false);
                        //runWorkRoutine();
                        //alert(objToString(this.current_rec));
                    }
                    return ('');
                    //alert(objToString(this.current_rec));
                }
            }]
        }

    ];

var confirmBarcodeRoutine = new tsdDialogRoutine(confirmBarcode_dialogArray, pick2Handle_dialogOptions);
confirmBarcodeRoutine.stopDialog = true;
confirmBarcodeRoutine.handlingFunction = function () {
    this.stopDialog = true;
    //alert('zuzu');
};




//Пристрел целевой ячейки
var handle_dialogArray = [
    {
        type: 'input', field: 'to_bin', caption: 'В зону #:to_zone_desc#', completedCaption: 'Размещено в ячейку %to_bin', errorCaption: '', confirmType: 'scan_bin'
        , validationRules: [{
            required: true, canChangeValue: true
            , onValidate: function (rec, value, d) {
                var error = ''
                rec.to_bin = value;
                //проверка - есть ли еще товар в ячейке и нужно ли подтверждать сканированием ГМ
                var url = '/getdata.asp?query=barcodeInfo&barcode=' + value;
                var d = new dataTable();
                d.getData(url);
                var bin = new $(d.lines).filter(function (index) { return (this.type == 'bin_info') });
                if (bin.length == 0) {
                    error = 'Ячейки ' + value + ' не существует'
                    return error;
                };
                window.current_rec = [];
                window.current_rec.push(rec);
                //тащим смежные ячейки
                window.near_bin_buffer = new $(d.lines).filter(function (index) { return (this.type == 'near_bin') });
                window.bin_buffer = bin;
                //если емкость в стандартных ГМ небольшая и есть данные в географии и запускаем подтверждение
                //!!!
                window.geo_buffer = new $(d.lines).filter(function (index) { return (this.type == 'geo_info') });
                window.oversize = $('#oversize').prop("checked");
                if (parseInt(bin[0].bin_capacity_in_psn) < 1000 && window.geo_buffer.length != 0) {
                    //запускаем подтверждение и выходим
                    var a = [];
                    a.push(this.current_rec);
                    pmTask.runAction(checkOnHandleRoutine, a, pmTask.container, false);
                    return '';
                };
                //если негабарит - запуск подтверждения негабарита и выходим
                if (window.oversize && parseInt(bin[0].bin_capacity_in_psn) < 1000) {
                    show_OversizeBins(window.near_bin_buffer, value);
                    return '';
                };
                var retVal = pmTask.line_ChangeStatus(rec, 4);
                if (retVal) {
                    pmTask.current_bin = value;
                    pmTask.load();
                    pmTask.switchView('list');
                    //alert(objToString(this.current_rec));
                    runWorkRoutine();
                    //alert(objToString(this.current_rec));
                }

                return error
            }
        }]
        , template: '<h4><input id="dialog_%field"  onchange="processDialogInput(this);"/><br/>Негабарит #:oversize#<input id="oversize" type="checkbox"/>%caption</h4>'
        , onShow: function (rec) {
            console.log(rec);
            if (rec.oversize) {
                $('#oversize').attr("checked", 1);
            };
        }
    }
];

var handleRoutine = new tsdDialogRoutine(handle_dialogArray, pick2Handle_dialogOptions);
handleRoutine.handlingFunction = function () {
    this.stopDialog = true;
    //alert('zuzu');
};


//проверка при пристреле целевой ячейки, если там уже есть товар
var checkOnHandle_dialogArray = [
    {
        type: 'input', field: 'check_psn', caption: 'В ячейке %to_bin уже есть товар. Отксанируйте любое ГМ из ячейки', completedCaption: 'Подтверждено', errorCaption: '', confirmType: 'scan'
        , validationRules: [{
            required: true, canChangeValue: true
            , onValidate: function (rec, value, d) {
                var error = ''
                var geo_index = -1;
                for (var i = 0; i < window.geo_buffer.length; i++) {
                    if (window.geo_buffer[i].psn == value) {
                        geo_index = i;
                    }
                };
                if (geo_index == -1) {
                    error = 'ГМ ' + value + ' в ячейке не числится';
                    alert(error);
                    return error;
                };
                //если негабарит - запуск подтверждения негабарита и выходим
                if (window.oversize && parseInt(window.bin_buffer[0].bin_capacity_in_psn) < 1000) {
                    show_OversizeBins(window.near_bin_buffer, rec.to_bin);
                    return '';
                };

                var retVal = pmTask.line_ChangeStatus(rec, 4);
                if (retVal) {
                    pmTask.current_bin = value;
                    pmTask.load();
                    pmTask.switchView('list');
                    //alert(objToString(this.current_rec));
                    runWorkRoutine();
                    //alert(objToString(this.current_rec));
                }

                return error
            }
        }]
        , template: '<h4><input id="dialog_%field"  onchange="processDialogInput(this);"></input><br/>%caption</h4>'
    }
];

var checkOnHandleRoutine = new tsdDialogRoutine(checkOnHandle_dialogArray, pick2Handle_dialogOptions);
checkOnHandle_dialogArray.handlingFunction = function () {
    this.stopDialog = true;
    //alert('zuzu');
};





var releaseBasket_fieldArray = [{ bin: '' }];


var releaseBasket_dialogArray =
    [

        {
            type: 'input', field: 'bin', caption: 'Сканируй ячейку', completedCaption: 'Ячейка %value отсканирована', errorCaption: 'Ошибка ', confirmType: 'scan_bin'
            , validationRules: [{ required: true, canChangeValue: true }]
        }

    ];


function createPMTask_ChooseReason(barcode, barcodeType, createAnyway) {
    var reasons = [
        { code: '', desc: 'Думаю не на своем месте. Проверить' }
        , { code: '02-ПОВРЕЖДЕНИЕ', desc: 'Повреждение поддона' }
        , { code: '03-ТОЛЬКО ПОЛ', desc: 'Тяжелый или крупногабарит' }
    ];
    var html = '<table border="1">';
    window.barcode = barcode;
    window.barcodeType = barcodeType;
    window.createAnyway = createAnyway;
    for (var z = 0; z < reasons.length; z++) {
        html += '<tr><td><div id="' + reasons[z].code + '" style="display:block;background-color:#D1D1D1;"  onclick="createPMTaskBy_Barcode(window.barcode, window.barcodeType, window.createAnyway, this.id)"><h2>' + reasons[z].desc + '</h2></div></t></tr>';
    };
    html += '</table>';
    document.getElementById("mainForm").innerHTML = html;

};

function createPMTaskBy_Barcode(barcode, barcodeType, createAnyway, reason) {
    //alert(pmTask.createPMTaskBy_Barcode);
    if (createAnyway) {
        reason = '99-УПЛОТНЕНИЕ';
    };
    if (pmTask.createPMTaskBy_Barcode(barcode, createAnyway, reason)) {
        var url = '/getdata.asp?query=pm_getTasks&barcode=' + barcode;
        pmTask.getData(url);
        pmTask.url = '/getdata.asp?query=pm_getTasks';
        var error = ''
        switch (pmTask.lines.length) {
            case 0:
                error = 'Товар на нужном месте хранения';
                alert(error);
                break;
            case 1:
                var current_rec = pmTask.lines[0];
                var a = [];
                a.push(current_rec);
                //если грузоместо - сразу в корзину
                if (barcodeType == 0) {
                    var retVal = pmTask.line_ChangeStatus(current_rec, 3);
                    if (retVal) {
                        pmTask.load();
                        pmTask.switchView('basket');
                        //alert(objToString(this.current_rec));
                        pmTask.runAction(handleRoutine, a, pmTask.container, false);
                        //alert(objToString(this.current_rec));
                    }
                }
                //иначе запускаем подтверждение
                else {
                    pmTask.runAction(confirmBarcodeRoutine, a, pmTask.container, false);
                };
                //alert(objToString(this.current_rec));
                break;
            default:
                error = 'Системная ошибка. Сформировано несколько строк заданий';
                alert(error);
                break;
        };
    }
}


function show_OversizeBins(buffer, choosedBin) {
    var html = '<table border="1"><tr>';
    for (var i = 0; i < buffer.length; i++) {
        var l = buffer[i];
        if (typeof (prev_l) != 'undefined') {
            if (prev_l.section != l.section || prev_l.pos_in_section != l.pos_in_section) {
                html += '</tr><tr>';
            };
        };
        if (l.code != choosedBin) {
            html += '<td class="td_unselected" onClick="td_Switch(this)"><h1>' + l.code + '</h1></td>';
        }
        else {
            html += '<td class="td_selected"><h1>' + l.code + '</h1></td>';
        };
        var prev_l = l;
    };
    window.choosedBin = choosedBin;
    html += '</tr></table>';
    html += '<button onClick="choose_OversizeBins()">Подтвердить</button><button onClick="switch_Oversize(false)">Это Габарит</button><button onClick="cancel_OversizeBins()">Отмена</button>';
    window.mainForm_oldHTML = document.getElementById("mainForm").innerHTML;
    document.getElementById("mainForm").innerHTML = html;
    html = choosedBin + '-  укажите занятые смежные ячейки';
    pmTask.container.innerHTML = html;
};

function choose_OversizeBins() {
    var retVal = pmTask.line_ChangeStatus(rec, 4);
    if (retVal) {
        pmTask.current_bin = value;
        pmTask.load();
        pmTask.switchView('list');
        //alert(objToString(this.current_rec));
        runWorkRoutine();
        //alert(objToString(this.current_rec));
    }
};


function cancel_OversizeBins() {
    document.getElementById("mainForm").innerHTML = window.mainForm_oldHTML;
    console.log(window.current_rec);
    pmTask.runAction(handleRoutine, window.current_rec, pmTask.container, false);
};

function switch_Ovesize(oversize) {
    alert('Not Released!!!');
};



function td_Switch(e) {
    //alert($(e).attr('class'));
    if ($(e).attr('class') == 'td_unselected') {
        $(e).toggleClass('td_unselected', false);
        $(e).toggleClass('td_selected', true);
    }
    else {
        $(e).toggleClass('td_selected', false);
        $(e).toggleClass('td_unselected', true);
    };


};



function show_barcodeInfo(barcode) {
    var url = '/getdata.asp?query=barcodeInfo&barcode=' + barcode;
    var d = new dataTable();
    d.getData(url);
    //window.location=url;
    //alert(d.lines.length);
    if (d.lines.length == 0) {
        alert('Данных по штрих коду ' + barcode + ' нет в базе');
        runWorkRoutine();
        return;
    };
    var html = '';
    for (var i = 0; i < d.lines.length; i++) {
        var l = d.lines[i];
        if (d.lines[i].type == 'serial_info') {
            html += '<h1>';
            html += l.sn + '<br/></h1>';
            //html+='<button onClick="editDirectory();return false;">Редактировать</button>';
            html += '<button id="' + l.sn + '"  onClick="createPMTask_ChooseReason(this.id, 0, false);">Поиск места хранения</button>';
            html += '<button id="' + l.sn + '"  onClick="createPMTaskBy_Barcode(this.id, 0, true);">Переместить принудительно</button><br/>';
            html += 'Тип ШК - <b>Серийный Номер</b> <br/>'
            html += 'СЗ Приемки: <b>' + l.receipt_wo + '</b><br/>'
            html += 'Дата Приемки: <b>' + l.receipt_date + '</b><br/>'
            html += 'Проект: <b>' + l.project + '</b><br/>'
            html += 'Ячейка по гео ' + l.actual_bin;
        }
    };

    for (var i = 0; i < d.lines.length; i++) {
        var l = d.lines[i];
        if (d.lines[i].type == 'bin_info') {
            html += '<h1>';
            html += l.code + '<br/></h1>';
            html += '<button id="' + l.code + '"  onClick="createPMTask_ChooseReason(this.id, 1, false);">Поиск места хранения</button>';
            html += '<button id="' + l.code + '"  onClick="createPMTaskBy_Barcode(this.id, 1, true);">Переместить принудительно</button><br/>';
            html += 'Тип ШК - <b>Код Ячейки</b> <br/>'
            html += 'Склад: <b>' + l.location + '</b><br/>'
        }
    };

    for (var i = 0; i < d.lines.length; i++) {
        var l = d.lines[i];
        if (d.lines[i].type == 'item_info') {
            html += '<h1>';
            html += l.item_desc + '<br/></h1>';
            html += 'Тип  - <b>Код Товара</b> <br/>'
            html += 'Артикул - ' + l.article + '<br/>';
            html += 'Штрихкод - ' + l.barcode + '<br/>';

        }
    };


    html += 'География:<br/><table border="1"><tr><th>Ячейка</th><th>ГМ</th><th>Товар</th><th>Ед.Изм.</th><th>СН</th><th>Колво</th><th>Резерв</th></tr>'
    for (var i = 0; i < d.lines.length; i++) {
        var l = d.lines[i];
        if (d.lines[i].type == 'geo_info') {
            html += '<tr>'
            html += '<td>' + l.bin + '</td>';
            html += '<td>' + l.psn + '</td>';
            html += '<td>' + l.item_desc + '</td>';
            html += '<td>' + l.uom + '</td>';
            html += '<td>' + l.sn + '</td>';
            html += '<td>' + l.qty + '</td>';
            html += '<td>' + l.qty_res + '</td>';
            html += '</tr>'
        }

    };


    html += '</table>';
    this.stopDialog = true;
    //alert(html);
    document.getElementById("mainForm").innerHTML = html;




}


