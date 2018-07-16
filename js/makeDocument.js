
function bootup(){
    getHeader();
    var ball = {"ClassCode":classCode};
    //alert(JSON.stringify(ball));
    $.ajax({
        'async': false,
        'type': "POST",
        'dataType': 'html',
        'url': "../Server/EncodeCourseCompletion.php",
        'data': ball,
        'success': function (data) {
            var decoded = JSON.parse(data);
            var complete = true;
            for (var i in decoded){
                var tag = "#"+i;
                if (isAGradClass && (i == "Outcomes")){
                    $(tag).toggleClass("good");
                    $(tag).text($(tag).text()+" Not Applicable");
                    continue;
                }
                complete = complete && decoded[i];
                if (decoded[i]){
                    $(tag).toggleClass("good");
                    $(tag).text($(tag).text()+" Complete");
                }else{
                    $(tag).toggleClass("bad");
                    $(tag).text($(tag).text()+" Incomplete");
                }
            }

            if (complete){
                $("#Complete").toggleClass("good");
                $("#Complete").text("Syllabus is complete.");
                $("#GoMakeDoc").show();
            }else{
                $("#Complete").toggleClass("bad");
                $("#Complete").text("Syllabus is not complete.");
            }
        }
    });

}