package org.diverse.pcm.formalizer.interpreters

import _root_.java.util.regex.{Pattern, Matcher}

import org.diverse.pcm.api.java
import org.diverse.pcm.api.java.impl.PCMFactoryImpl
import org.diverse.pcm.api.java.{Feature, Value, PCMFactory}
import scala.collection.JavaConversions._
import org.diverse.pcm.formalizer.extractor.CellContentInterpreter

abstract class PatternInterpreter(
	val validHeaders : List[String],
    regex : String,
    val parameters : List[String],
    val confident : Boolean
    ) {

  val factory : PCMFactory = new PCMFactoryImpl

	private val pattern : Pattern =  Pattern.compile(regex, Pattern.UNICODE_CHARACTER_CLASS |
	    Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE | Pattern.DOTALL)

	var validProducts : List[java.Product] = Nil
  var validFeatures : List[Feature] = Nil

  var cellContentInterpreter : CellContentInterpreter = _

  protected var lastCall : Option[(String, java.Product, Feature)] = None

  def setCellContentInterpreter(interpreter : CellContentInterpreter) {
    cellContentInterpreter = interpreter
  }
    
	def interpret(s : String, product : java.Product, feature : Feature) : Option[Value] = {

	  var result : Option[Value] = None
	  
	  if (!lastCall.isDefined || (s, product, feature) != lastCall.get) {
		  if ((validProducts.isEmpty || validProducts.contains(product))
				  && (validFeatures.isEmpty || validFeatures.contains(feature))) {
		    val matcher = pattern.matcher(s)
			  if (matcher.matches()) {
				result = createValue(s, matcher, parameters, product, feature)
			  }
			  
		  }
	  } 

	  lastCall = None
	  result
	}
	
	def createValue(s : String, matcher : Matcher, parameters : List[String], product : java.Product, feature : Feature) : Option[Value]
	
	def format (s : String) : String = {
	  val words = for (word <- s.split("(?U:\\s)") if !word.isEmpty()) yield word
      val formattedContent = words.mkString("", " ", "").toLowerCase()
      formattedContent
	}
	
	
  
}

