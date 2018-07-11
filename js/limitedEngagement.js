var tableData;
function createRecord(i){
    var payTag = "payType"+i;
    var lecID = tableData[i].LecturerID;
    var payType = getRadioValue(payTag);
    if (payType == null){
        alert("Please select if payment is default rate");
        return;
    }
    var ball = {"AccessCode":headerClassData.AccessCode,"LecturerID":lecID,"Mode":"INSERT","DefaultPay":payType};
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/NewLimitedEngagementRecord.php",
        'data': ball,
        'success': function (data) {
            if (data.substring(0,7) == "SUCCESS"){
                alert("Data successfully sent to database");
                tableData[i].HasForm = true;
                tableData[i].DefaultPay = payType;
                $("#RowStatus"+i).html(formStatus(i));
                generateTable();
            }else{
                var w = window.open();
                $(w.document.body).html(data);
            }
            wait = false;
        }
    });
}
function getRadioValue(id){
    var options = document.getElementsByName(id);
    for(var i = 0; i < options.length; i++){
        if(options[i].checked){
            return options[i].value;
        }
    }
    return null;
}
function editForm(i){
    var row = tableData[i];
    var lecIdGetParam = "&Instructor="+row.LecturerID;
    goPage("LimitedEngagementForm",lecIdGetParam);
}
function formStatus(i){
    var row = tableData[i];
    //alert(JSON.stringify(row));
    if (row.Submitted == "Yes") return "Submitted";
    if (row.HasForm){
        //return '<button type="button" id="createRecordButton" onClick="goPage("LimitedEngagementForm",'+lecIdGetParam+');">Edit</button>';
        var editButtonText = "Edit";
        if (row.Due) editButtonText = "Edit & Submit";
        return '<button type="button" id="editRecordButton" onClick="editForm('+i+');">'+editButtonText+'</button>';
    }else{
        return '<button type="button" id="createRecordButton" onClick="createRecord('+i+');">Create</button>';
    }
}
function getViewFileCell(i){
    var row = tableData[i];
    if (row.HasForm){
        if (row.Filepath){
            return "<a href='"+row.Filepath+"'>View</a>";
        }
    }
    return "";
}
function getDefaultPaymentCell(i){
    var row = tableData[i];
    if (row.HasForm){
        if (row.DefaultPay == "Yes") return "Default Scale";
        if (row.DefaultPay == "No") return "Custom Amount";
        if (row.DefaultPay == "Unk") return "Unknown";
        return "Enum error("+i+","+row.DefaultPay+")";
    }else{
        var $ret = $("<div></div>")
        $ret.append('<input type="radio" name="payType'+i+'" value="Yes">Default ($150/hour)');
        $ret.append('<input type="radio" name="payType'+i+'" value="No">Custom');
        //alert($ret.html());
        return $ret.html();
        //return "selection not yet implemented";
    }
}
function getCVCell(i){
    var CVData = tableData[i].CV;
    var linkText = "Error";
    if (CVData.HasCV) linkText = "Uploaded "+CVData.FormattedTimestamp;
    else linkText = "Required";
    var cameFrom = encodeURIComponent("Coord/LimitedEngagementByClass.html?ClassCode="+headerClassData.AccessCode);
    var linkAddress = "InstructorCV.html?Instructor="+tableData[i].LecturerID+"&CameFrom="+cameFrom;
    //var linkAddress= "";

    var linkHTML = "<a href='"+linkAddress+"'>"+linkText+"</a>";
    return linkHTML;
}
function generateTable(){
    $('#TableSpan').html('');
    var $table = $('<table id="LETable" style="width:100%" align="center"><tr><th>Last</th><th>First</th><th>Status</th><th>Form</th><th>Payment</th><th>View</th><th>CV</th></tr></table>');
    for (var i in tableData){
        var row = tableData[i];
        $table.append('<tr><td>'+row.LastName+'</td><td>'+row.FirstName+'</td><td>'+row.Status+'</td><td id="RowStatus'+i+'">'+formStatus(i)+'</td><td>'+getDefaultPaymentCell(i)+'</td><td>'+getViewFileCell(i)+'</td><td>'+getCVCell(i)+'</td></tr>');
    }
    $('#TableSpan').append($table);
}
function getRecordsData(){
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/IdentifyLimitedEngagementLecturers.php",
        'data':{"AccessCode":headerClassData.AccessCode},
        'success': function (ball) {
            //alert(ball);
            var jason = JSON.parse(ball);
            tableData = jason;
            if (jason.length == 0) $("#NoLENeeded").show();
            else generateTable();
            //$("#lastName").val(jason.LastName);
            //$("#firstName").val(jason.FirstName);


            //$("#"+jason.USStatus).attr('checked', 'checked');
        }
    });
}
function goBack(){
    goPage("Portal");
}
function makeSyllabus(){
    goPage("MakeDocument");
}
function bootup(){
    getHeader();
    getRecordsData();
}