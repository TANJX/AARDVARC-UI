var classCode = getGetVariable("ClassCode");
var headerClassData = null;
var hostName = window.location.hostname;
var isAGradClass = false;
function getGetVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return null;
}
function getHeader(){
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/EncodeCourseHeader.php",
        'data':{"AccessCode":classCode},
        'success': function (ball) {
            if ((ball.substring(0,7) == "NOCODE") || (ball.substring(0,7) == "BADCODE")){
                $("#CourseTitle").text("Invalid Course Code");
            }else{
                $("#Entry").show();
                var jason = JSON.parse(ball);
                var sinfo = jason.SemesterInfo;
                var cinfo = jason.CourseInfo;
                headerClassData = cinfo;
                $("#CourseTitle").text(cinfo.Title);
                var semString = sinfo.Term+" "+sinfo.Year+": "+cinfo.CourseID;
                $("#SemesterTitle").text(semString);
                isAGradClass = cinfo.Program == "PhDMS";
            }
        }
    });
    getFooter();
}
function getFooter(){
    $.ajax({
        'async': true,
        'type': "POST",
        'dataType': 'html',
        'url': "../Resources/Version.html",
        'data':{},
        'success': function (ball) {
            $("#Footer").html(ball);
        }
    });

}
function goPage(pagename,extras=""){
    window.location="../Coord/"+pagename+".html?ClassCode="+classCode+extras;
}