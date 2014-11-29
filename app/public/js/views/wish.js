function testNum(number){
	if(/^[\d|.]+$/.test(number)){
		return true;
	}else{
		alert("Invalid number",number);
		return false;
	}           
}   
$(document).ready(function(){
	$("button").click(function() {
		var id = $(this).val();
		var sel = "button[value='"+id+"']";
		if($(this).attr("id") == "confirm"){
			var price = $(this).parent().siblings("#price").children("input").val();
			var discount = $(this).parent().siblings("#discount").children("input").val();
			var freight = $(this).parent().siblings("#freight").children("input").val();
			var btn = $(this);

			if(testNum(price) && testNum(discount) && testNum(freight)){
				$.post("/confirm/wish",{id:id,price:price,discount:discount,freight:freight},function(data){
					$(sel)[0].disabled=true;
					$(sel)[1].disabled=true;
					if(data.code == "error"){
						alert("error:"+data.msg);
					}
				}); 

			}
		}else if($(this).attr("id") == "delete"){
			$.get('/admin/del/wish/?id='+id,function(data){
				$(sel)[0].disabled=true;
				$(sel)[1].disabled=true;

			});
		}
	});
});
