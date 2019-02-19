(function(_, $) {
	var iTree = function(el, option) {
		this.$el = $(el)
		this.$el_ = this.$el.clone();
		this.options = option
		this.init()
	}

	iTree.DEFAULT_OPTIONS = {
		data: {},
		check: false,
		select: false,
		allExpand: false,
		nodeKey: 'children',
		pid: 'pid',
		name: 'name',
		id: 'id',
		pickType: 'none',
		speed: 300,
		openSpeed: null,
		closeSpeed: null,
		lockExpand: false,
		expendLevel: 0,
		ajax: function() {
			return null
		},
		onOpenNode: function(node) {
			return false
		},
		onCloseNode: function(node) {
			return false
		},
		onCheckLabel: function(data) {
			return false
		},
		onUncheckLabel: function() {
			return false
		},
		onExpend: function() {
			return false
		},
		onAllCheck: function() {
			return false
		},
		onAllUnCheck: function() {
			return false
		},
		onAllExpend: function() {
			return false
		},
		onAllUnExpend: function() {
			return false
		}

	}

	iTree.CLASS = {
		ROOT: 'dl',
		NODE: 'p',
		NODEWARP: 'title',
		EXBTN: 'nobtn',
		CHILD: 'sub',
		BEFORE: 'before',
		AFTER: 'after'
	}

	iTree.EVENT = {
		'open-node.itree': 'onOpenNode',
		'close-node.itree': 'onCloseNode',
		'check-label.itree': 'onCheckLabel',
		'uncheck-label.itree': 'onUncheckLabel',
		'expend.itree': 'onExpend',
		'all-expend.itree': 'onAllExpend',
		'all-unexpend.itree': 'onAllUnExpend',
		'all-check.itree': 'onAllCheck',
		'all-uncheck.itree': 'onAllUnCheck'
	}

	iTree.NODE = 'node'
	iTree.LABEL = 'label'

	iTree.prototype.trigger = function(name) {
		var args = [].slice.call(arguments, 1);
		//console.log(args)
		name += '.itree'
		this.options[iTree.EVENT[name]].apply(this.options, args)
		this.$el.trigger($.Event(name), args)

	}

	iTree.prototype.init = function() {
		this.options = $.extend(iTree.DEFAULT_OPTIONS, this.options)
		this.$labelPool = {}
		this.initTree()
		this.initSpeed()
	}

	iTree.prototype.initTree = function() {
		var that = this
		var _creat = function(data, isFrist) {
			var _nodes = isFrist ? '<div class="dl iTree">' : '<div class="sub"><i class="before"></i>',
				i = 0,
				len = data.length,
				opt = that.options;
			for (; i < len; i++) {
				var item = data[i],
					nodes = item[opt.nodeKey],
					name = item[opt.name],
					id = item[opt.id],
					pid = item[opt.pid],
					hasNodes = nodes != undefined && nodes instanceof Array && nodes.length > 0,
					tag = hasNodes ? '' : 'tagtip',
					nodeClass = [tag],
					checkDom = hasNodes ? ['<span>', name, '</span><div class="nobtn"><i class="plus"></i></div>'].join('') : that.createLabel(item),
					CN = name.match(/[\u4e00-\u9fa5]/g),
					CN_len = !!CN ? CN.length : 0,
					EN_len = name.length - CN_len,
					tagLong = CN_len * 15 + EN_len * 9 + 20,
					PX = tagLong > 120 ? tagLong : 120,
					W = hasNodes ? '' : 'width : ' + PX + 'px;';

				i == 0 && nodeClass.push('first')
				i == (len - 1) && nodeClass.push('last')

				_nodes += ['<div class="title ', nodeClass.join(' '), ' " style = "', W, '" >',
					'<i class="before"></i>',
					'<i class="after"></i>',
					'<div class="p " data-type="' + (hasNodes ? iTree.NODE : iTree.LABEL) + '"  title="' + name + '"><i class="after"></i>' + checkDom + '</div>'
				].join('')

				if (hasNodes) {
					_nodes += _creat(nodes)
				}

				_nodes += '</div>'
			}

			_nodes += '</div>'

			return _nodes
		}

		var treeNode = _creat(this.options.data, true)

		this.$tree = $(treeNode)
		this.$el.append(this.$tree)
		this.$nodes = this.$tree.find('[data-type="node"]')
		this.$label = this.$tree.find('[data-type="label"] label')
		this.$inputs = this.options.pickType && this.$label.find('input[type="checkbox"]')
		this.setExpend()
		this.$tree.find('[data-expand]').off('click').on('click', function(e) {
			if (that.options.lockExpand) {
				return;
			}
			var isExpand = $(this).data('expand')
			that[isExpand === 'open' ? 'close' : 'open'](this)
			that.trigger('expend')
		})
		this.extendLevel()
		this.initLabel()
	}

	iTree.prototype.createLabel = function(item) {
		var label, that = this,
			id = item[this.options.id]


		switch (this.options.pickType) {
			case 'select':
				label = '<label><span>' + item[this.options.name] + '</span></label>'
				break;
			case 'check':
				label = ['<label class="_l" data-id="' + item[this.options.id] + '">',
					'<input class="tagcheck" data-name="' + item[this.options.name] + '" type="checkbox" value="' + item[this.options.id] + '" />',
					'<span>' + item[this.options.name] + '</span>',
					'</label>'
				].join('')
				break;
			case 'none':
				label = '<label><span>' + item[this.options.name] + '</span></label>'
				break;
			default:
				// statements_def
				break;
		}
		this.$labelPool['label' + id] === undefined && (this.$labelPool['label' + id] = item)
		return label

	}

	iTree.prototype.initLabel = function() {
		var that = this
		this.$label.each(function() {
			$(this).data('data', that.$labelPool['label' + $(this).attr('data-id')])
				.off('click').on('click', function(e) {
					var checked = $(this).find('input').prop('checked')
					that.trigger(checked ? 'check-label' : 'uncheck-label', $(this).data('data'))
				})
		})
	}

	iTree.prototype.initSpeed = function() {
		if (this.options.speed && typeof this.options.speed === 'number') {
			if (!this.options.openSpeed || typeof this.options.openSpeed !== 'number') {
				this.options.openSpeed = this.options.speed

			}
			if (!this.options.closeSpeed || typeof this.options.closeSpeed !== 'number') {
				this.options.closeSpeed = this.options.speed

			}

		} else {
			this.options.openSpeed = this.options.closeSpeed = this.options.speed
		}
		//return this.options.speed ? this.options.speed
	}

	iTree.prototype.close_ = function(el) {
		var $this = $(el)
		$this.closest('.title')
			.find('.nobtn > i').removeClass('minus').addClass('plus').end()
			.find('[data-expand="open"]').attr('data-expand', 'close').data('expand', 'close').end()
			.find('.sub').hide(this.options.closeSpeed)
		//this.trigger('open-node')

	}

	iTree.prototype.open_ = function(el) {
		var $this = $(el)
		$this.attr('data-expand', 'open')
			.data('expand', 'open')
			.find('.nobtn > i').addClass('minus').removeClass('plus').end()
			.next('.sub').show(this.options.openSpeed)
		//this.trigger('close-node')
	}

	iTree.prototype.close = function(el) {
		this.close_(el)
		this.trigger('open-node')

	}

	iTree.prototype.open = function(el) {
		this.open_(el)
		this.trigger('close-node')
	}

	iTree.prototype.setExpend = function(flag) {
		var flag = flag === undefined ? this.options.allExpand : flag,
			initExpand = flag ? 'open' : 'close',
			that = this
		this.$nodes.each(function() {
			that[flag ? 'open_' : 'close_'](this)
		})
		// this.$tree.find('[data-type="node"]')
		// 	.attr('data-expand', initExpand)
		// 	.data('expand', initExpand)
		// 	.end().find('.sub').css({'display' : flag ? 'block' : 'none'})

	}

	iTree.prototype.allExpend = function() {
		this.setExpend(true)
		this.trigger('all-expend')
	}

	iTree.prototype.allUnExpend = function() {
		this.setExpend(false)
		this.trigger('all-unexpend')
	}

	iTree.prototype.expendLabel = function(labelId) {
		var $label = this.getLabel(labelId),
			$parent = $label.closest('.sub').prev()
		while ($parent.length == 1) {
			this.open_($parent)
			$parent = $parent.closest('.sub').prev()
		}
	}

	iTree.prototype.findLabel = function(labelId) {
		var $label = this.getLabel(labelId)
		return $label.length ? $label : false
	}



	iTree.prototype.allCheck = function() {
		var checkId = []
		this.$inputs.prop('checked', true).each(function() {
			checkId.push($(this).val())
		})
		this.trigger('all-check')
		return checkId
	}



	iTree.prototype.check = function(labelId) {
		var $label = this.getLabel(labelId)
		$label ? $label.find('input[type="checkbox"]').prop('checked', true) : ''
		this.trigger('check-label', $label.data('data'))
		return $label.data('data')
	}

	iTree.prototype.unAllCheck = function() {
		this.$inputs.prop('checked', false)
		this.trigger('all-uncheck')
	}

	iTree.prototype.unCheck = function(labelId) {
		var $label = this.getLabel(labelId)
		$label ? $label.find('input[type="checkbox"]').prop('checked', false) : ''
		this.trigger('uncheck-label', $label.data('data'))
		return $label.data('data')
	}

	iTree.prototype.extendLevel = function() {
		var $nodes = this.$tree,
			i = 0,
			len = this.options.extendLevel || 0
		for (; i < len; i++) {
			$vnodes = $nodes.children('.title')
			this.open_($vnodes.children('.p'))
			$nodes = $vnodes.children('.sub')
		}
	}

	iTree.prototype.countWords = function(words) {

	}

	iTree.prototype.bindEvent = function() {

	}

	iTree.prototype.getLabel = function(labelId) {
		return this.$label.filter('[data-id=' + labelId + ']')
	}

	iTree.prototype.destroy = function() {
		this.$tree.remove()
	}

	iTree.prototype.lockExpand = function(flag) {
		this.$tree.addClass('lock-expend')
		return this.options.lockExpand = true
	}

	iTree.prototype.unLockExpand = function() {
		this.$tree.removeClass('lock-expend')
		return this.options.lockExpand = false
	}

	iTree.prototype.update = function(options) {
		this.options = $.extend(this.options, options)
	}

	iTree.prototype.refresh = function() {

		this.init()
	}

	$.fn.iTree = function(option) {
		var args = [].slice.call(arguments, 1),
			value;
		this.each(function() {
			var data = $(this).data('iTree')
			if (typeof option === 'string') {

				if (!data) {
					return;
				}

				value = data[option].apply(data, args)
			}
			if (!data) {
				$(this).data('iTree', (data = new iTree(this, option)))
			}
		})
		return typeof value === 'undefined' ? this : value
	}


})(window, jQuery)