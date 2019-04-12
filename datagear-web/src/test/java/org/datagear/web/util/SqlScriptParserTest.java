/*
 * Copyright (c) 2018 datagear.org. All Rights Reserved.
 */

package org.datagear.web.util;

import static org.junit.Assert.assertEquals;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringReader;
import java.util.List;

import org.datagear.web.util.SqlScriptParser.SqlStatement;
import org.junit.Test;

/**
 * {@linkplain SqlScriptParser}单元测试类。
 * 
 * @author datagear@163.com
 *
 */
public class SqlScriptParserTest
{
	@Test
	public void parseTestDefaultDelimiterSingle() throws IOException
	{
		String script = "select * from t_order;";

		SqlScriptParser parser = new SqlScriptParser(toStringReader(script));

		List<SqlStatement> sqlStatements = parser.parse();

		assertEquals(1, sqlStatements.size());

		SqlStatement sqlStatement = sqlStatements.get(0);

		assertEquals("select * from t_order", sqlStatement.getSql());
		assertEquals(0, sqlStatement.getStartRow());
		assertEquals(0, sqlStatement.getStartColumn());
		assertEquals(0, sqlStatement.getEndRow());
		assertEquals(script.length() - 1, sqlStatement.getEndColumn());
	}

	@Test
	public void parseTestDefaultDelimiterSingleSpace() throws IOException
	{
		String script = "  select * from t_order  ;";

		SqlScriptParser parser = new SqlScriptParser(toStringReader(script));

		List<SqlStatement> sqlStatements = parser.parse();

		assertEquals(1, sqlStatements.size());

		SqlStatement sqlStatement = sqlStatements.get(0);

		assertEquals("select * from t_order", sqlStatement.getSql());
		assertEquals(0, sqlStatement.getStartRow());
		assertEquals(0, sqlStatement.getStartColumn());
		assertEquals(0, sqlStatement.getEndRow());
		assertEquals(script.length() - 1, sqlStatement.getEndColumn());
	}

	@Test
	public void parseTestDefaultDelimiterSingleLine() throws IOException
	{
		String script = "--start comment" + SqlScriptParser.LINE_SEPARATOR + "select * from"
				+ SqlScriptParser.LINE_SEPARATOR + "-- center comment" + SqlScriptParser.LINE_SEPARATOR + " t_order;  ";

		SqlScriptParser parser = new SqlScriptParser(toStringReader(script));

		List<SqlStatement> sqlStatements = parser.parse();

		assertEquals(1, sqlStatements.size());

		SqlStatement sqlStatement = sqlStatements.get(0);

		assertEquals("select * from" + SqlScriptParser.LINE_SEPARATOR + "-- center comment"
				+ SqlScriptParser.LINE_SEPARATOR + " t_order", sqlStatement.getSql());
		assertEquals(1, sqlStatement.getStartRow());
		assertEquals(0, sqlStatement.getStartColumn());
		assertEquals(3, sqlStatement.getEndRow());
		assertEquals(" t_order".length(), sqlStatement.getEndColumn());
	}

	@Test
	public void parseTestDefaultDelimiterMultiple() throws IOException
	{
		String script = "select * from t_order;update t_product set name='5';delete from t_user;";

		SqlScriptParser parser = new SqlScriptParser(toStringReader(script));

		List<SqlStatement> sqlStatements = parser.parse();

		assertEquals(3, sqlStatements.size());

		{
			SqlStatement sqlStatement = sqlStatements.get(0);

			assertEquals("select * from t_order", sqlStatement.getSql());
			assertEquals(0, sqlStatement.getStartRow());
			assertEquals(0, sqlStatement.getStartColumn());
			assertEquals(0, sqlStatement.getEndRow());
			assertEquals("select * from t_order".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(1);

			assertEquals("update t_product set name='5'", sqlStatement.getSql());
			assertEquals(0, sqlStatement.getStartRow());
			assertEquals("select * from t_order;".length(), sqlStatement.getStartColumn());
			assertEquals(0, sqlStatement.getEndRow());
			assertEquals("select * from t_order;update t_product set name='5'".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(2);

			assertEquals("delete from t_user", sqlStatement.getSql());
			assertEquals(0, sqlStatement.getStartRow());
			assertEquals("select * from t_order;update t_product set name='5';".length(),
					sqlStatement.getStartColumn());
			assertEquals(0, sqlStatement.getEndRow());
			assertEquals(script.length() - 1, sqlStatement.getEndColumn());
		}
	}

	@Test
	public void parseTestDefaultDelimiterMultipleSpace() throws IOException
	{
		String script = "  \t  select * from t_order ; \t update t_product set name='5' ; \t delete from t_user; \t \t";

		SqlScriptParser parser = new SqlScriptParser(toStringReader(script));

		List<SqlStatement> sqlStatements = parser.parse();

		assertEquals(3, sqlStatements.size());

		{
			SqlStatement sqlStatement = sqlStatements.get(0);

			assertEquals("select * from t_order", sqlStatement.getSql());
			assertEquals(0, sqlStatement.getStartRow());
			assertEquals(0, sqlStatement.getStartColumn());
			assertEquals(0, sqlStatement.getEndRow());
			assertEquals("  \t  select * from t_order ".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(1);

			assertEquals("update t_product set name='5'", sqlStatement.getSql());
			assertEquals(0, sqlStatement.getStartRow());
			assertEquals("  \t  select * from t_order ;".length(), sqlStatement.getStartColumn());
			assertEquals(0, sqlStatement.getEndRow());
			assertEquals("  \t  select * from t_order ; \t update t_product set name='5' ".length(),
					sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(2);

			assertEquals("delete from t_user", sqlStatement.getSql());
			assertEquals(0, sqlStatement.getStartRow());
			assertEquals("  \t  select * from t_order ; \t update t_product set name='5' ;".length(),
					sqlStatement.getStartColumn());
			assertEquals(0, sqlStatement.getEndRow());
			assertEquals(
					"  \t  select * from t_order ; \t update t_product set name='5' ; \t delete from t_user".length(),
					sqlStatement.getEndColumn());
		}
	}

	@Test
	public void parseTestDefaultDelimiterMultipleSpaceLine() throws IOException
	{
		String script = "select \t *" + SqlScriptParser.LINE_SEPARATOR + " from t_order;"
				+ SqlScriptParser.LINE_SEPARATOR + "--update " + SqlScriptParser.LINE_SEPARATOR
				+ " \t update t_product set name='5' ;" + SqlScriptParser.LINE_SEPARATOR + "--delete"
				+ SqlScriptParser.LINE_SEPARATOR + " \t delete from t_user; \t \t";

		SqlScriptParser parser = new SqlScriptParser(toStringReader(script));

		List<SqlStatement> sqlStatements = parser.parse();

		assertEquals(3, sqlStatements.size());

		{
			SqlStatement sqlStatement = sqlStatements.get(0);

			assertEquals("select \t *" + SqlScriptParser.LINE_SEPARATOR + " from t_order", sqlStatement.getSql());
			assertEquals(0, sqlStatement.getStartRow());
			assertEquals(0, sqlStatement.getStartColumn());
			assertEquals(1, sqlStatement.getEndRow());
			assertEquals(" from t_order".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(1);

			assertEquals("update t_product set name='5'", sqlStatement.getSql());
			assertEquals(3, sqlStatement.getStartRow());
			assertEquals(0, sqlStatement.getStartColumn());
			assertEquals(3, sqlStatement.getEndRow());
			assertEquals(" \t update t_product set name='5' ".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(2);

			assertEquals("delete from t_user", sqlStatement.getSql());
			assertEquals(5, sqlStatement.getStartRow());
			assertEquals(0, sqlStatement.getStartColumn());
			assertEquals(5, sqlStatement.getEndRow());
			assertEquals(" \t delete from t_user".length(), sqlStatement.getEndColumn());
		}
	}

	@Test
	public void parseTestScriptFile() throws IOException
	{
		InputStream inputStream = SqlScriptParserTest.class.getClassLoader()
				.getResourceAsStream("org/datagear/web/util/SqlScriptParserTest.sql");

		Reader reader = new InputStreamReader(inputStream, "UTF-8");

		SqlScriptParser parser = new SqlScriptParser(reader);

		List<SqlStatement> sqlStatements = parser.parse();

		assertEquals(11, sqlStatements.size());

		{
			SqlStatement sqlStatement = sqlStatements.get(0);

			assertEquals("select" + SqlScriptParser.LINE_SEPARATOR + "\t*" + SqlScriptParser.LINE_SEPARATOR + "from"
					+ SqlScriptParser.LINE_SEPARATOR + "\tt_order", sqlStatement.getSql());
			assertEquals(2, sqlStatement.getStartRow());
			assertEquals(0, sqlStatement.getStartColumn());
			assertEquals(5, sqlStatement.getEndRow());
			assertEquals("	t_order".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(1);

			assertEquals("select * from t_product", sqlStatement.getSql());
			assertEquals(10, sqlStatement.getStartRow());
			assertEquals(0, sqlStatement.getStartColumn());
			assertEquals(10, sqlStatement.getEndRow());
			assertEquals("select * from t_product".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(2);

			assertEquals("delete" + SqlScriptParser.LINE_SEPARATOR + SqlScriptParser.LINE_SEPARATOR + "from"
					+ SqlScriptParser.LINE_SEPARATOR + "\tt_user", sqlStatement.getSql());
			assertEquals(10, sqlStatement.getStartRow());
			assertEquals("select * from t_product;".length(), sqlStatement.getStartColumn());
			assertEquals(13, sqlStatement.getEndRow());
			assertEquals("	t_user".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(3);

			assertEquals("update " + SqlScriptParser.LINE_SEPARATOR + SqlScriptParser.LINE_SEPARATOR + "--comment"
					+ SqlScriptParser.LINE_SEPARATOR + SqlScriptParser.LINE_SEPARATOR + "t_user "
					+ SqlScriptParser.LINE_SEPARATOR + SqlScriptParser.LINE_SEPARATOR + SqlScriptParser.LINE_SEPARATOR
					+ "set name = '3'", sqlStatement.getSql());
			assertEquals(17, sqlStatement.getStartRow());
			assertEquals(0, sqlStatement.getStartColumn());
			assertEquals(24, sqlStatement.getEndRow());
			assertEquals("set name = '3'".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(4);

			assertEquals("select ; from" + SqlScriptParser.LINE_SEPARATOR + "t_user;" + SqlScriptParser.LINE_SEPARATOR
					+ "where id = 3", sqlStatement.getSql());
			assertEquals(27, sqlStatement.getStartRow());
			assertEquals(0, sqlStatement.getStartColumn());
			assertEquals(29, sqlStatement.getEndRow());
			assertEquals("where id = 3".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(5);

			assertEquals("select * from a", sqlStatement.getSql());
			assertEquals(33, sqlStatement.getStartRow());
			assertEquals(0, sqlStatement.getStartColumn());
			assertEquals(33, sqlStatement.getEndRow());
			assertEquals("select * from a".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(6);

			assertEquals("select * from b", sqlStatement.getSql());
			assertEquals(33, sqlStatement.getStartRow());
			assertEquals("select * from a;".length(), sqlStatement.getStartColumn());
			assertEquals(33, sqlStatement.getEndRow());
			assertEquals("select * from a;select * from b".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(7);

			assertEquals("select * from c", sqlStatement.getSql());
			assertEquals(34, sqlStatement.getStartRow());
			assertEquals(0, sqlStatement.getStartColumn());
			assertEquals(34, sqlStatement.getEndRow());
			assertEquals("select * from c".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(8);

			assertEquals("select * from a", sqlStatement.getSql());
			assertEquals(38, sqlStatement.getStartRow());
			assertEquals(0, sqlStatement.getStartColumn());
			assertEquals(38, sqlStatement.getEndRow());
			assertEquals("select * from a".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(9);

			assertEquals("select * from b", sqlStatement.getSql());
			assertEquals(38, sqlStatement.getStartRow());
			assertEquals("select * from a/*d*/".length(), sqlStatement.getStartColumn());
			assertEquals(38, sqlStatement.getEndRow());
			assertEquals("select * from a/*d*/select * from b".length(), sqlStatement.getEndColumn());
		}

		{
			SqlStatement sqlStatement = sqlStatements.get(10);

			assertEquals("select * from c" + SqlScriptParser.LINE_SEPARATOR + "--", sqlStatement.getSql());
			assertEquals(39, sqlStatement.getStartRow());
			assertEquals(0, sqlStatement.getStartColumn());
			assertEquals(40, sqlStatement.getEndRow());
			assertEquals("--".length(), sqlStatement.getEndColumn());
		}
	}

	protected StringReader toStringReader(String s)
	{
		return new StringReader(s);
	}
}
