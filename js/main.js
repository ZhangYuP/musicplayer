var EventCenter = {
  on: function(type, handler){
    $(document).on(type, handler)
  },
  fire: function(type, data){
    $(document).trigger(type, data)
  }
}

var Footer = {
  init() {
    this.$footer = $('footer')
    this.$ul = this.$footer.find('ul')
    this.$box = this.$footer.find('.box')
    this.$leftBtn = this.$footer.find('.icon-left')
    this.$rightBtn = this.$footer.find('.icon-right')
    this.isAnimate = false
    this.bind()
    this.render()
  },

  bind() {
    $(window).resize(()=>{
      this.setStyle()
    })

    this.$rightBtn.on('click', ()=>{
      if(this.isAnimate) return
      var width = this.$footer.find('li').outerWidth(true)
      var distance = parseInt(this.$box.width() / width) * width
      if(this.$ul.position().left + this.$ul.width() > distance){
        this.isAnimate = true
        this.$ul.animate({left: '-=' + distance}, 400, ()=>{
          this.isAnimate = false
        })
      }
    })

    this.$leftBtn.on('click', ()=>{
      if(this.isAnimate) return
      var width = this.$footer.find('li').outerWidth(true)
      var distance = parseInt(this.$box.width() / width) * width
      if(this.$ul.position().left < 0){
        this.isAnimate = true
        this.$ul.animate({left: '+=' + distance}, 400, ()=>{
          this.isAnimate = false
        })
      }
    })

    this.$footer.on('click', 'li', function(){
      $(this).addClass('active')
        .siblings().removeClass('active')

      EventCenter.fire('select-album', {
        channelId: $(this).attr('data-channel-id'),
        channelName: $(this).attr('data-channel-name')
      })
    })

    EventCenter.on('reset-album', (e, channelId)=>{
      this.$footer.find(`[data-channel-id=${channelId}]`).addClass('active')
      .siblings().removeClass('active')
    })
  },

  render() {
    $.ajax({
      url: 'https://jirenguapi.applinzi.com/fm/getChannels.php',
      dataType: 'json'
    }).then(
      (ret)=>{
        this.renderFooter(ret.channels)
      },
      ()=>{console.log('error')
    })
  },

  renderFooter(channels) {
    var html = `<li data-channel-id="collection" data-channel-name="我的收藏"><div class="cover" style="background-image:url('https://s2.ax1x.com/2019/06/23/ZFIIYt.jpg')"></div><h3>我的收藏</h3></li>`
    channels.forEach(function(channel){
      html += `<li data-channel-id="${channel.channel_id}" data-channel-name="${channel.name}"><div class="cover" style="background-image:url('${channel.cover_small}')"></div><h3>${channel.name}</h3></li>`
    })
    this.$ul.html(html)
    this.setStyle()
  },

  setStyle() {
    var count = this.$footer.find('li').length
    var width = this.$footer.find('li').outerWidth(true)
    this.$ul.css({
      width: count * width + 'px'
    })
  }

}

var Fm = {
  init() {
    this.$main = $('main')
    this.audio = new Audio()
    this.audio.autoplay = 'autoplay'
    this.bind()
    this.list = []
    this.timeArr = []
    this.index = 0
  },

  bind() {
    var _this = this
    EventCenter.on('select-album', function(e, options){
      _this.channelId = options.channelId
      _this.channelName = options.channelName
      _this.loadMusic()
    })
    this.$main.find('.btn-play').on('click', function(){
      var $btn = $(this)
      if($btn.hasClass('icon-play')){
        $btn.removeClass('icon-play').addClass('icon-pause')
        _this.audio.play()
      }else{
        $btn.removeClass('icon-pause').addClass('icon-play')
        _this.audio.pause()
      }
    })
    this.$main.find('.btn-next').on('click', function(){
      _this.loadMusic()
    })
    this.$main.find('.btn-pre').on('click', function(){
      if(_this.list.length > 1){
        _this.list.pop()
        _this.song = _this.list[_this.list.length - 1].song
        _this.channelId = _this.list[_this.list.length - 1].channelId
        _this.channelName = _this.list[_this.list.length - 1].channelName
        _this.setMusic()

        EventCenter.fire('reset-album', _this.channelId)
      }
    })
    this.audio.addEventListener('play', function(){
      _this.updateStatus()
      _this.statusClock = setInterval(function(){
        _this.updateStatus()
      }, 500)
    })
    this.audio.addEventListener('pause', function(){
      clearInterval(_this.statusClock)
      if(_this.audio.ended){
        _this.loadMusic()
      }
    })
    this.$main.find('.progressBar').on('click', function(e){
      if(!document.onmousemove){
        _this.controlProgress(e)
      }
    })
    this.$main.find('.progressBtn').on('mousedown', function(){
      document.onmousemove = function(e){
        _this.controlProgress(e)
      }
    })
    document.onmouseup = function(){
      document.onmousemove = null
    }
    this.$main.find('.btn-collect').on('click', function(){
      _this.collectMusic()
    })
  },

  loadMusic() {
    if(this.channelId === 'collection'){
      var arr = []
      Object.keys(localStorage).forEach(key => {
          if(JSON.parse(localStorage[key])['song']){
            arr.push(key)
          }
        }
      )
      if(arr.length === 0){
        alert('你还没有收藏歌曲哦，请点击右侧任意专辑开始播放！')
      }else{
        if(this.index >= arr.length){this.index = 0}
        this.song = JSON.parse(localStorage[arr[this.index]]).song
        this.channelName = arr[this.index].channelName
        this.index += 1
        this.setMusic()
        this.list.push({song: this.song, channelId: this.channelId, channelName: this.channelName})
      }
    }else{
      $.ajax({
        url: 'https://jirenguapi.applinzi.com/fm/getSong.php',
        dataType: 'json',
        data: {channel: 'this.channelId'}
      }).then((ret)=>{
        this.song = ret['song'][0]
        if(!this.song.url){
          this.loadMusic()
        }else{
          this.setMusic()
          this.list.push({song: this.song, channelId: this.channelId, channelName: this.channelName})
        }
      })
    }
  },

  setMusic() {
    this.changeCollectionStatus()
    this.audio.src = this.song.url
    $('.bg').css('background-image', `url(${this.song.picture})`)
    this.$main.find('aside figure').css('background-image', `url(${this.song.picture})`)
    this.$main.find('.info .tag').text(this.channelName)
    this.$main.find('.info h1').text(this.song.title)
    this.$main.find('.info .artist').text(this.song.artist)
    this.$main.find('.btn-play').removeClass('icon-play').addClass('icon-pause')
    this.loadLyric()
  },

  loadLyric() {
    $.ajax({
      url: 'https://jirenguapi.applinzi.com/fm/getLyric.php',
      dataType: 'json',
      data: {sid: this.song.sid}
    }).then((ret)=>{
      var html = ''
      var lyric = ret.lyric
      var lyricObj = {}
      lyric.split('\n').forEach((line)=>{
        var times = line.match(/\d{2}:\d{2}/g)
        var str = line.replace(/\[.+?\]/g, '')
        if(times){
          times.forEach((time)=>{
            lyricObj[time] = str
          })
        }
      })
      this.timeArr = Object.keys(lyricObj).sort()
      this.timeArr.forEach((time)=>{
        html += `<p data-time="${time}">${lyricObj[time]}</p>`
      })
      this.$main.find('.info .lyric').html(html)
    })
  },

  updateStatus() {
    var min = Math.floor(this.audio.currentTime / 60) + ''
    var second = Math.floor(this.audio.currentTime % 60) + ''
    second = second.length === 2 ? second : '0' + second
    // 显示歌曲当前时间
    this.$main.find('.currentTime').text(min + ':' + second)
    // 进度条
    this.$main.find('.progress').width(this.audio.currentTime / this.audio.duration * 100 + '%')
    // 歌词高亮和滚动
    var lyricTime = (min.length === 2 ? min : '0' + min) + ':' + second
    var index = this.timeArr.indexOf(lyricTime)
    if (index === -1){
      var result = this.timeArr.filter(function(elem){
        return (elem < lyricTime)
      })
      lyricTime = result[result.length-1]
      index = this.timeArr.indexOf(lyricTime)
    }
    this.$main.find(`[data-time="${lyricTime}"]`).addClass('active')
      .siblings().removeClass('active')
      .parent().css({'margin-top': `${9 - 3 * index}vh`})
  },

  controlProgress(e) {
    var progressBar = this.$main.find('.progressBar')
    var currentProgress = this.audio.currentTime / this.audio.duration * progressBar.width()
    var toProgress = e.clientX - progressBar.offset().left
    if (toProgress < 0){
      toProgress = 0
    }else if(toProgress > progressBar.width()){
      toProgress = progressBar.width()
    }
    this.$main.find('.progress').width('+=' + ( toProgress - currentProgress ) / progressBar.width() * 100 + '%')
    this.audio.currentTime = toProgress / progressBar.width() * this.audio.duration
  },

  collectMusic() {
    if(!this.isCollected){
      localStorage.setItem(this.song.sid, JSON.stringify({song: this.song, channelId: this.channelId, channelName: this.channelName}))
    }else{
      localStorage.removeItem(this.song.sid)
    }
    this.changeCollectionStatus()
  },

  changeCollectionStatus() {
    if(localStorage.getItem(this.song.sid)){
      this.isCollected = true
      this.$main.find('.btn-collect').addClass('active')
    }else{
      this.isCollected = false
      this.$main.find('.btn-collect').removeClass('active')
    }
  }
}

Footer.init()
Fm.init()
