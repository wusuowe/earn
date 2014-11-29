function uploadWin(img){
	var pageii =$.layer({
		type : 2,
		title: '上传图片',
		shadeClose: false,
		maxmin: false,
		fix : true,  
		area: ['800px', 550],                     
		iframe: {
			src : '/admin/upload?name='+img.id+"&src="+img.src
		},
		success:function(){

		},
		end:function(){
		}

	});
			
		

}

function userStat(user){
	var pageii =$.layer({
		type : 2,
		title: '用户详情',
		shadeClose: false,
		maxmin: false,
		fix : true,  
		area: ['800px', 550],                     
		iframe: {
			src : '/admin/user/detail?user_id='+user.id
		},
		success:function(){

		},
		end:function(){
		}

	});
		
}

function userList(user){
	var pageii =$.layer({
		type : 2,
		title: '用户列表',
		shadeClose: false,
		maxmin: false,
		fix : true,  
		area: ['800px', 550],                     
		iframe: {
			src : '/admin/user/list'+user.value
		},
		success:function(){

		},
		end:function(){
		}

	});
		
}

function offerList(offer){
	var pageii =$.layer({
		type : 2,
		title: '任务列表',
		shadeClose: false,
		maxmin: false,
		fix : true,  
		area: ['800px', 550],                     
		iframe: {
			src : '/admin/offer/list'+offer.value
		},
		success:function(){

		},
		end:function(){
		}

	});
		
}

function selExchange(status,page){
	window.location.href='/admin/list/exchange?status='+status+'&page=0';
}
function selWish(status,page){
	window.location.href='/admin/list/wish?status='+status+'&page=0';
}

