(function () {

    window.barcodeInfo = {
        show: function (e) {
            app.onCompleteScan = function (value) {
                $("#search").val(value);
                barcodeInfo.search(value);
            };

            //alert(this);
            var barcode = e.view.params.barcode;
            if (typeof barcode == 'string') {
                console.log($("#search"));
                $("#search").val(barcode);
                barcodeInfo.search(barcode);
            }
            $
        },
        search: function (value) {
            console.log(value);
            if (typeof value == 'object') value = $("#search").val();
            var d = app.sql_common.op_barcodeInfo(value);

            var a = new $(d.lines).filter(function (index) { return (this.type == 'bin_info') });
            barcodeInfo.bin_datasource = new kendo.data.DataSource({ data: a });

            var a = new $(d.lines).filter(function (index) { return (this.type == 'serial_info') });
            barcodeInfo.serial_datasource = new kendo.data.DataSource({ data: a });

            var a = new $(d.lines).filter(function (index) { return (this.type == 'item_info') });
            barcodeInfo.item_datasource = new kendo.data.DataSource({ data: a });

            var a = new $(d.lines).filter(function (index) { return (this.type == 'geo_info') });
            barcodeInfo.geo_datasource = new kendo.data.DataSource({ data: a, group: { field: "psn" } });

            console.log(barcodeInfo.geo_datasource);
            $("#geo_list").data("kendoMobileListView").setDataSource(barcodeInfo.geo_datasource);
        }
    };
} ());