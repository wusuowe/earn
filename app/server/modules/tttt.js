var formatFeedData = function(fd,os,platform){
	fd.platform = platform;
	fd.fd_time = moment().unix();
	switch(platform){
		case 'Playerize':
			fd.fd_user = fd.uid;
			fd.fd_device = null;
			fd.fd_coin = parseInt(fd.new,10);
			fd.fd_note = '<Playerize>';
			delete fd['uid'];
			delete fd['fd.new'];
			break;
		case 'NativeX':
			fd.fd_user = fd.publisherUserId;
			if(os=='android'){
				fd.fd_device = fd.androidDeviceId;
			}else{
				fd.fd_device = fd.iosIDFA;
			}
			fd.fd_coin = parseInt(fd.devicePayoutInCurrency,10);
			fd.fd_note = '<Playerize>';
			delete fd['publisherUserId'];
			delete fd['fd.devicePayoutInCurrency'];
			delete fd['androidDeviceId'];
			delete fd['iosIDFA'];
			break;


	}

	return fd;
}

