var ES = require('./email-settings');
var EM = {};
module.exports = EM;

EM.server = require("emailjs/email").server.connect({

    host        : ES.host,
	user        : ES.user,
	password    : ES.password,
	ssl         : true

});

EM.dispatchLottery = function(account,code,callback)
{
	EM.server.send({
		from         : ES.sender,
		to           : account.email,
		subject      : '点赚恭喜你获得大奖',
		text         : 'congratulations',
		attachment   : EM.composeEmail(account,code)
	}, callback );
}

EM.composeEmail = function(o)
{
	var html = "<html><body>";
	html += "你好， "+o.user_id+",<br><br>";
	html += "恭喜你在本次抽奖活动中抽得iphone手机一部<br>";
	html += "请尽快联系我司工作人员进行领取<br>";
	html += "领取码"+code+"<br>";
	html += "点赚公司敬上<br>";
	html += "</body></html>";
	return  [{data:html, alternative:true}];
}
