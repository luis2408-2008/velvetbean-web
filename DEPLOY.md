# Deploying to Render.com 🚀

Your app is now ready for the cloud! Follow these steps to deploy it on Render (free tier).

## 1. Prerequisites
- Push this code to a GitHub repository.

## 2. Setting up the Database (PostgreSQL)
1. Log in to [dashboard.render.com](https://dashboard.rend  er.com).
2. Click **New +** -> **PostgreSQL**.
3. Name it `cafeteria-db`.
4. Choose the Free Tier.
5. Click **Create Database**.
6. Once created, copy the **Internal Database URL**. You will need this.

## 3. Deploying the Web Service
1. On Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Settings:
   - **Name**: `velvet-bean`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. **Environment Variables** (Section lower down):
   - Add `DATABASE_URL` = postgresql://cafeteria_db_zsn4_user:UtigBFk6jQE2Js9aKPcEd5NRbgqpumlG@dpg-d5mnlp6mcj7s73c6vuq0-a/cafeteria_db_zsn4
   - Add `SMTP_HOST` = `smtp.gmail.com`
   - Add `SMTP_USER` = luismontoya200408@gmail.com
   - Add `SMTP_PASS` = jkuz uazg yaiw kdrt
   - Add `SMTP_SECURE` = `true`
5. Click **Create Web Service**.

## 🎉 Success!
Render will detect the `DATABASE_URL`, connect to Postgres automatically (thanks to our new code), create the tables, and start your site. 
Your site will be live at `https://velvet-bean.onrender.com` (or similar).


postgresql://cafeteria_db_zsn4_user:UtigBFk6jQE2Js9aKPcEd5NRbgqpumlG@dpg-d5mnlp6mcj7s73c6vuq0-a/cafeteria_db_zsn4