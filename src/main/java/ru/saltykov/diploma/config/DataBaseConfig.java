package ru.saltykov.diploma.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;

import javax.sql.DataSource;

@Configuration
public class DataBaseConfig {
    //@Profile("production")
    //@Primary
    @Bean(name = "dataSource")
    public DataSource productionDataSource() {
        /*JndiContextReader jndi = new JndiContextReader();
        String ctxFrom = jndi.readAppContextString("fias.ds.from", "fias");*/

/*        String userName = jndi.readAppContextString(ctxFrom + ".ds.user", "postgres");
        String password = jndi.readAppContextString(ctxFrom + ".ds.pwd", "postgres");
        String dbHost = jndi.readAppContextString(ctxFrom + ".ds.host", "localhost");
        String dbPort = jndi.readAppContextString(ctxFrom + ".ds.port", "5432");
        String dbName = jndi.readAppContextString(ctxFrom + ".ds.db", "fias");
        Integer maxPoolSize = jndi.readAppContextInteger(ctxFrom + ".ds.pool.size", 6);
        Integer maxLifeTime = jndi.readAppContextInteger(ctxFrom + ".ds.pool.maxLifeTime", 1800);*/

        HikariConfig config = new HikariConfig();
        config.setDriverClassName(org.h2.Driver.class.getCanonicalName()/*org.postgresql.Driver.class.getCanonicalName()*/);
        //config.setJdbcUrl("jdbc:postgresql://" + dbHost + ":" + dbPort + "/" + dbName);
        config.setJdbcUrl("jdbc:h2:mem:testdb");
        //config.setUsername(userName);
        //config.setPassword(password);
        config.setUsername("admin");
        config.setPassword("admin");
        config.setConnectionTimeout(300);
        config.setIdleTimeout(15000);
        //config.setMaxLifetime(maxLifeTime * 1000);
        //config.setMaximumPoolSize(maxPoolSize);
        //config.setMinimumIdle(Math.max(1, maxPoolSize / 2));
        config.setConnectionTestQuery("SELECT now()");
        return new HikariDataSource(config);
    }

    /*@Profile("test")
    @Bean(name = "dataSource")
    public DataSource testDataSource() {
        //DriverManagerDataSource ds = new DriverManagerDataSource("jdbc:postgresql://172.16.7.127:5432/fias_gar", "postgres", "postgres");
        DriverManagerDataSource ds = new DriverManagerDataSource("jdbc:postgresql://localhost:5433/postgres", "postgres", "postgres");
        ds.setDriverClassName("org.postgresql.Driver");
        return ds;
    }*/

    @Bean
    @Primary
    public PlatformTransactionManager transactionManager(DataSource dataSource) {
        DataSourceTransactionManager tm = new DataSourceTransactionManager(dataSource);
        tm.setDefaultTimeout(30);
        return tm;
    }
}
