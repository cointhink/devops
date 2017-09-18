server {
  listen 443 ssl http2;
  listen [::]:443 ssl http2;
  server_name cointhink.com *.cointhink.com;

  ssl_certificate /home/devops/letsencrypt/certificates/cointhink.com.crt;
  ssl_certificate_key /home/devops/letsencrypt/certificates/cointhink.com.key;

  root /home/devops/web-elm/public;

  location /stripe {
    proxy_pass http://localhost:8085;
  }

  location /ws {
    proxy_set_header  X-Real-IP        $remote_addr;
    proxy_set_header  X-Forwarded-For  $proxy_add_x_forwarded_for;
    proxy_set_header  Host             $http_host;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_http_version 1.1;

    proxy_pass http://localhost:8085;
  }

  location / {
    try_files $uri $uri.html $uri/index.html =404;
  }
}
