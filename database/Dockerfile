FROM postgres:16-alpine
ENV POSTGRES_DB=foodie
ENV POSTGRES_USER=foodie
ENV POSTGRES_PASSWORD=foodie
COPY init.sql /docker-entrypoint-initdb.d/init.sql
EXPOSE 5432
