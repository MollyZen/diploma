package ru.saltykov.diploma.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.apache.ibatis.type.LocalDateTimeTypeHandler;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.annotation.MapperScan;
import org.mybatis.spring.transaction.SpringManagedTransactionFactory;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;
import ru.saltykov.diploma.util.UUIDTypeHandler;

import javax.sql.DataSource;

@Configuration
@MapperScan("ru.saltykov.diploma.repositories")
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
        //String tmp = "jdbc:h2:file:" + StaticResourceConfiguration.homeDir + "h2db";
        //config.setJdbcUrl(tmp);
        //System.out.println("H2 path: " + tmp);
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

    @Bean
    public SpringManagedTransactionFactory managedTransactionFactory() {
        return new SpringManagedTransactionFactory();
    }

    @Bean
    @Primary
    public SqlSessionFactoryBean sqlSessionFactoryBean(
            DataSource dataSource,
            SpringManagedTransactionFactory managedTransactionFactory,
            ApplicationContext context
    ) {
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean();
        bean.setConfiguration(new org.apache.ibatis.session.Configuration() {{
            this.setLazyLoadingEnabled(true);
            this.setAggressiveLazyLoading(false);
            this.setMultipleResultSetsEnabled(true);
            this.getLazyLoadTriggerMethods().clear();
        }});
        bean.setDataSource(dataSource);
        bean.setTransactionFactory(managedTransactionFactory);
        bean.setTypeHandlers(new UUIDTypeHandler(),
                new LocalDateTimeTypeHandler());
        return bean;
    }

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }
}
