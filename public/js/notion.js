// 使用 Fetch API 获取数据库内容
fetch('/api/getDatabaseContent')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        // 在页面上渲染数据库内容
        var databaseContent = document.getElementById('cards-container');
        data.results.forEach(function(result) {
            // 创建可以点击的卡片
            var card = document.createElement('a');
            card.href = result.properties.Website.url;
            card.target = '_blank';
            card.className = 'card';
            // 创建卡片图像
            var image = document.createElement('img');
            image.className = 'card-image';
            image.src = result.properties.Icons.files && result.properties.Icons.files[0] && result.properties.Icons.files[0].file.url || '';
            card.appendChild(image);
            // 创建卡片标题
            var title = document.createElement('h2');
            title.className = 'card-title';
            title.innerText = result.properties.Name.title[0].plain_text;
            card.appendChild(title);
            // 创建卡片标签
            var tags = document.createElement('div');
            tags.className = 'card-tags';
            result.properties.Category.multi_select.forEach(function(tag) {
                var tagElement = document.createElement('span');
                tagElement.className = 'card-tag';
                tagElement.innerText = tag.name;
                tags.appendChild(tagElement);
            });
            card.appendChild(tags);
            // 创建卡片描述
            var description = document.createElement('p');
            description.className = 'card-description';
            description.innerText = result.properties.Description.rich_text[0].plain_text;
            card.appendChild(description);
            // 将卡片添加到页面
            databaseContent.appendChild(card);
        });
    })
    .catch(function(error) {
        console.error(error);
    });

// 将Category属性的值，过滤重复项，添加到导航栏中
fetch('/api/getDatabaseContent')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        var categories = [];
        data.results.forEach(function(result) {
            result.properties.Category.multi_select.forEach(function(tag) {
                if (!categories.includes(tag.name)) {
                    categories.push(tag.name);
                }
            });
        });
        //插入在h1标签后面
        var navDiv = document.getElementById('nav');

        categories.forEach(function(category) {
            var link = document.createElement('a');
            link.href = '#';
            link.textContent = category;
            var separator = document.createElement('em');
            separator.textContent = ' | ';
            navDiv.insertBefore(separator, navDiv.firstChild);
            navDiv.insertBefore(link, navDiv.firstChild);
            link.addEventListener('click', function(event) {
                event.preventDefault();
                var cards = document.querySelectorAll('.card');
                cards.forEach(function(card) {
                    if (card.innerText.includes(category)) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    })
    .catch(function(error) {
        console.error(error);
    });


