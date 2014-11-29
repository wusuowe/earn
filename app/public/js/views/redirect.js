var isMobile = {
	Android: function() {
		return navigator.userAgent.match(/Android/i);
	},
	BlackBerry: function() {
		return navigator.userAgent.match(/BlackBerry/i);
	},
	iOS: function() {
		return navigator.userAgent.match(/iPhone|iPad|iPod/i);
	},
	Opera: function() {
		return navigator.userAgent.match(/Opera Mini/i);
	},
	Windows: function() {
		return navigator.userAgent.match(/IEMobile/i);
	},
	any: function() {
		return (isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
	}
};
var check_platform = function(){
	if ( isMobile.Android() ) {
		//document.location.href = "https://play.google.com/store/apps/details?id=com.privateP.makemoney";
		document.location.href = "http://mp.weixin.qq.com/mp/redirect?url=https%3A//play.google.com/store/apps/details%3Fid%3Dcom.privateP.makemoney";
	}

	else if(isMobile.iOS())
	{
		document.location.href="/iOS.html";
		//	document.location.href="http://mp.weixin.qq.com/mp/redirect?url=https%3A//itunes.apple.com/cn/app/ingage-crm/id654720925%3Fls%3D1%26mt%3D8";
		//	document.location.href="https://itunes.apple.com/cn/app/ingage-crm/id654720925?ls=1&mt=8";
		//	document.location.href="http://moment.douban.com/download/?source=post_bottom&from_rec=1&target=ios&from_pid=106740";
	}else{
//		document.location.href = "https://play.google.com/store/apps/details?id=com.privateP.makemoney";
		//	alert('Only iOs or Android can install this App');
		document.location.href = "http://mp.weixin.qq.com/mp/redirect?url=https%3A//play.google.com/store/apps/details%3Fid%3Dcom.privateP.makemoney";
//		
	}
};

check_platform();
