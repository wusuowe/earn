$(document).ready(function(){
	$("button").click(function() {
		var target = $(this).attr("id"); 
		$.get('/admin/user/disable?user_id='+target,function(data){

		});

	});
});
