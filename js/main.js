var EventCenter = {
  on: function(type, handler){
    $(document).on(type, handler)
  },
  fire: function(type, data){
    $(document).trigger(type, data)
  }
}

//EventCenter.on('hello', function(e){
//  console.log(e.detail)
//})

//EventCenter.fire('hello', '你好')

var Footer = {
  init() {
    this.$footer = $('footer')
    this.$ul = this.$footer.find('ul')
    this.$box = this.$footer.find('.box')
    this.$leftBtn = this.$footer.find('.icon-left')
    this.$rightBtn = this.$footer.find('.icon-right')
    this.bind()
    this.render()
  },

  bind() {
    $(window).resize(()=>{
      this.setStyle()
    })

    this.$rightBtn.on('click', ()=>{
      var width = this.$footer.find('li').outerWidth(true)
      var distance = parseInt(this.$box.width() / width) * width
      if(this.$ul.position().left + this.$ul.width() > distance){
        this.$ul.animate({left: '-=' + distance}, 400)
      }      
    })

    this.$leftBtn.on('click', ()=>{
      var width = this.$footer.find('li').outerWidth(true)
      var distance = parseInt(this.$box.width() / width) * width
      if(this.$ul.position().left < 0){
        this.$ul.animate({left: '+=' + distance}, 400)
      }
    })
    
    this.$footer.on('click', 'li', function(){
      $(this).addClass('active')
        .siblings().removeClass('active')
      
      EventCenter.fire('select-album', $(this).attr('data-channel-id'))
    })
  },
  
  render() {
    $.ajax({
      url: 'http://api.jirengu.com/fm/getChannels.php',
      method: 'get'
    }).then(
      (ret)=>{
        this.renderFooter(JSON.parse(ret).channels)
      },
      ()=>{console.log('error')
    })
  },

  renderFooter(channels) {
    var html = ''
    channels.forEach(function(channel){
      html += `<li data-channel-id="${channel.channel_id}"><div class="cover" style="background-image:url('${channel.cover_small}')"></div><h3>${channel.name}</h3></li>`
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

var App = {
  init() {
    this.bind()
  },
  bind() {
    EventCenter.on('select-album', function(e, data){
      console.log('select ', data)
    })
  }
}

Footer.init()
App.init()
